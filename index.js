// Cloudflare Worker for Service Reminder System
// This worker provides the booking form and API endpoints

// Sample customer data (in production, this would come from MongoDB)
const sampleCustomers = {
  'test-uuid-123': {
    customer_id: 'CUST001',
    uuid: 'test-uuid-123',
    full_name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '555-0101',
    vehicle_display: '2020 Toyota Camry',
    vehicle_make: 'Toyota',
    vehicle_model: 'Camry',
    vehicle_year: 2020,
    license_plate: 'ABC123',
    last_service_date: '2025-06-15',
    service_type: 'annual_service',
    booking_status: 'pending'
  }
};

// Sample bookings (in production, this would be stored in MongoDB)
const bookings = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Health check
      if (path === '/api/health') {
        return jsonResponse({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
      }
      
      // Get customer by UUID
      if (path.match(/^\/api\/customer\/[^\/]+$/)) {
        const uuid = path.split('/').pop();
        const customer = sampleCustomers[uuid] || {
          customer_id: 'CUST' + Math.floor(Math.random() * 1000),
          uuid: uuid,
          full_name: 'Test Customer',
          email: 'test@example.com',
          phone: '555-0000',
          vehicle_display: '2020 Test Vehicle',
          vehicle_make: 'Test',
          vehicle_model: 'Vehicle',
          vehicle_year: 2020,
          license_plate: 'TEST' + Math.floor(Math.random() * 1000),
          last_service_date: new Date(Date.now() - 340 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          service_type: 'annual_service',
          booking_status: 'pending'
        };
        
        return jsonResponse(customer);
      }
      
      // Get available time slots
      if (path === '/api/available-slots') {
        const date = url.searchParams.get('date');
        
        if (!date) {
          return jsonResponse({ error: 'Date parameter required' }, 400);
        }
        
        // Check if date is a weekend
        const checkDate = new Date(date);
        const dayOfWeek = checkDate.getDay();
        
        // Return available slots (every 2 hours from 8 AM to 4 PM)
        const allSlots = ['08:00', '10:00', '12:00', '14:00', '16:00'];
        
        // For weekends, return fewer slots
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return jsonResponse({
            date,
            available_slots: ['10:00', '14:00'],
            note: 'Weekend hours - limited availability'
          });
        }
        
        // Check if any slots are already booked for this date
        const bookedSlots = [];
        bookings.forEach((booking, key) => {
          if (booking.booking_date === date) {
            bookedSlots.push(booking.time_slot);
          }
        });
        
        // Filter out booked slots
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        
        return jsonResponse({
          date,
          available_slots: availableSlots,
          total_slots: allSlots.length,
          booked_slots: bookedSlots.length
        });
      }
      
      // Submit booking
      if (path.match(/^\/api\/booking\/[^\/]+$/)) {
        const uuid = path.split('/').pop();
        
        if (request.method === 'POST') {
          const body = await request.json();
          
          // Validate required fields
          if (!body.booking_date || !body.time_slot) {
            return jsonResponse({ 
              error: 'Missing required fields: booking_date, time_slot' 
            }, 400);
          }
          
          // Create booking
          const bookingId = 'BOOK' + Date.now();
          const booking = {
            booking_id: bookingId,
            customer_uuid: uuid,
            ...body,
            status: 'confirmed',
            created_at: new Date().toISOString()
          };
          
          // Store booking
          bookings.set(bookingId, booking);
          
          // Generate Google Calendar link
          const calendarDate = body.booking_date.replace(/-/g, '');
          const [startHour, startMin] = body.time_slot.split(':');
          const startTime = startHour + startMin + '00';
          const endHour = (parseInt(startHour) + 2).toString().padStart(2, '0');
          const endTime = endHour + startMin + '00';
          
          const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('🔧 Service: ' + (body.service_type || 'Annual Service'))}&dates=${calendarDate}T${startTime}/${calendarDate}T${endTime}&details=${encodeURIComponent('Service appointment booked through Service Reminder System')}&location=${encodeURIComponent('Automotive Garage')}`;
          
          return jsonResponse({
            success: true,
            message: 'Booking confirmed!',
            booking: {
              booking_id: bookingId,
              customer_id: uuid,
              booking_date: body.booking_date,
              time_slot: body.time_slot,
              calendar_link: calendarLink
            }
          });
        }
        
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }
      
      // Trigger reminders (admin only)
      if (path === '/api/trigger-reminders') {
        const apiKey = request.headers.get('x-api-key');
        
        // In production, validate admin API key
        // if (apiKey !== env.ADMIN_API_KEY) {
        //   return jsonResponse({ error: 'Unauthorized' }, 401);
        // }
        
        return jsonResponse({
          success: true,
          message: 'Reminder check completed',
          results: {
            processed: 0,
            sent: 0,
            failed: 0,
            details: []
          },
          note: 'This is a demo endpoint. In production, this would scan the database and send emails.'
        });
      }
      
      // Dashboard statistics
      if (path === '/api/stats') {
        return jsonResponse({
          total_customers: Object.keys(sampleCustomers).length,
          due_for_service: 1,
          bookings_this_month: bookings.size,
          emails_sent: 0,
          note: 'Demo statistics. In production, these would be calculated from MongoDB.'
        });
      }
      
      // Serve booking form
      if (path === '/' || path === '/booking' || path.match(/^\/booking\/[^\/]+$/)) {
        return new Response(bookingHTML, {
          headers: { 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      return jsonResponse({ error: 'Not found' }, 404);
      
    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({ error: error.message }, 500);
    }
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    }
  });
}

const bookingHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Book Your Service - Automotive Garage</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card-shadow { box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="gradient-bg text-white py-6">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-3xl">🔧</span>
          <div>
            <h1 class="text-xl font-bold">Automotive Garage</h1>
            <p class="text-sm opacity-80">Service Booking System</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="container mx-auto px-4 py-8 max-w-lg">
    <div class="bg-white rounded-2xl card-shadow p-6 mb-6">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <span class="text-2xl">👤</span>
        </div>
        <div>
          <h2 id="customer-name" class="text-lg font-semibold text-gray-800">Loading...</h2>
          <p id="vehicle-info" class="text-sm text-gray-500"></p>
          <p id="last-service" class="text-xs text-gray-400 mt-1"></p>
        </div>
      </div>
    </div>

    <div id="booking-form-container" class="bg-white rounded-2xl card-shadow p-6">
      <h3 class="text-xl font-bold text-gray-800 mb-6">📅 Book Your Service</h3>
      <form id="booking-form" class="space-y-5">
        <input type="hidden" id="customer-uuid">
        <input type="hidden" id="customer-id">

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
          <select id="service-type" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
            <option value="annual_service">🔧 Annual Service</option>
            <option value="oil_change">🛢️ Oil Change</option>
            <option value="brake_service">🛑 Brake Service</option>
            <option value="tire_rotation">🔄 Tire Rotation</option>
            <option value="full_inspection">🔍 Full Inspection</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
          <input type="date" id="booking-date" required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
          <select id="time-slot" required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
            <option value="">Select a time...</option>
          </select>
          <p id="slots-note" class="text-xs text-gray-500 mt-1 hidden">Loading available slots...</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
          <textarea id="notes" rows="3" placeholder="Any specific concerns or requests..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"></textarea>
        </div>

        <button type="submit" id="submit-button"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition transform hover:scale-[1.02] active:scale-[0.98] shadow-lg">
          📅 Confirm Booking
        </button>
      </form>
    </div>

    <div id="success-screen" class="hidden bg-white rounded-2xl card-shadow p-6 text-center">
      <div class="text-6xl mb-4">🎉</div>
      <h3 class="text-2xl font-bold text-green-600 mb-2">Booking Confirmed!</h3>
      <p class="text-gray-600 mb-6">Your service appointment has been scheduled.</p>

      <div class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
        <div class="flex justify-between mb-2">
          <span class="text-gray-500">Customer:</span>
          <span id="success-customer" class="font-medium"></span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="text-gray-500">Vehicle:</span>
          <span id="success-vehicle" class="font-medium"></span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="text-gray-500">Date:</span>
          <span id="success-date" class="font-medium"></span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="text-gray-500">Time:</span>
          <span id="success-time" class="font-medium"></span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Service:</span>
          <span id="success-service" class="font-medium"></span>
        </div>
      </div>

      <a id="calendar-link" href="#" target="_blank"
        class="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition mb-3">
        📅 View in Calendar
      </a>

      <button id="book-another"
        class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition">
        Book Another Service
      </button>
    </div>

    <div id="notification" class="hidden fixed bottom-4 left-4 right-4 p-4 rounded-lg text-white text-center transition"></div>
  </div>

  <script>
    const pathParts = window.location.pathname.split('/');
    const uuid = pathParts[pathParts.length - 1] || 'test-uuid-123';

    function formatDate(date) {
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    }

    async function loadCustomer() {
      try {
        const response = await fetch('/api/customer/' + uuid);
        if (!response.ok) throw new Error('Customer not found');

        const data = await response.json();

        document.getElementById('customer-name').textContent = 'Hello, ' + data.full_name;
        document.getElementById('vehicle-info').textContent = data.vehicle_display + ' (' + data.license_plate + ')';
        document.getElementById('last-service').textContent = 'Last Service: ' + (data.last_service_date ? new Date(data.last_service_date).toLocaleDateString() : 'N/A');

        document.getElementById('customer-uuid').value = data.uuid;
        document.getElementById('customer-id').value = data.customer_id;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('booking-date').min = formatDate(tomorrow);

        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 3);
        document.getElementById('booking-date').value = formatDate(defaultDate);

        await loadAvailableSlots(formatDate(defaultDate));

      } catch (error) {
        console.error('Error:', error);
        showNotification('Error loading data. Please check your link.', 'error');
      }
    }

    async function loadAvailableSlots(date) {
      const timeSelect = document.getElementById('time-slot');
      const slotsNote = document.getElementById('slots-note');
      
      try {
        slotsNote.classList.remove('hidden');
        slotsNote.textContent = 'Loading available slots...';
        
        const response = await fetch('/api/available-slots?date=' + date);
        const data = await response.json();

        timeSelect.innerHTML = '<option value="">Select a time...</option>';

        if (data.available_slots && data.available_slots.length > 0) {
          data.available_slots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = formatTime(slot);
            timeSelect.appendChild(option);
          });
          slotsNote.textContent = data.note || data.available_slots.length + ' slots available';
          slotsNote.className = 'text-xs text-green-600 mt-1';
        } else {
          const option = document.createElement('option');
          option.value = '';
          option.textContent = 'No slots available - try another date';
          timeSelect.appendChild(option);
          slotsNote.textContent = 'No slots available for this date';
          slotsNote.className = 'text-xs text-red-500 mt-1';
        }
      } catch (error) {
        console.error('Error loading slots:', error);
        slotsNote.textContent = 'Error loading slots. Please try again.';
        slotsNote.className = 'text-xs text-red-500 mt-1';
      }
    }

    function formatTime(time) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return displayHour + ':' + minutes + ' ' + ampm;
    }

    function showNotification(message, type = 'success') {
      const notification = document.getElementById('notification');
      notification.textContent = message;
      notification.className = 'fixed bottom-4 left-4 right-4 p-4 rounded-lg text-white text-center transition ' + (type === 'error' ? 'bg-red-500' : 'bg-green-500');
      notification.classList.remove('hidden');

      setTimeout(() => {
        notification.classList.add('hidden');
      }, 5000);
    }

    document.getElementById('booking-date').addEventListener('change', async (e) => {
      await loadAvailableSlots(e.target.value);
    });

    document.getElementById('booking-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitButton = document.getElementById('submit-button');
      submitButton.textContent = '📅 Confirming...';
      submitButton.disabled = true;

      try {
        const formData = {
          booking_date: document.getElementById('booking-date').value,
          time_slot: document.getElementById('time-slot').value,
          service_type: document.getElementById('service-type').value,
          notes: document.getElementById('notes').value
        };

        if (!formData.time_slot) {
          throw new Error('Please select a time slot');
        }

        const response = await fetch('/api/booking/' + uuid, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
          document.getElementById('booking-form-container').style.display = 'none';
          document.getElementById('success-screen').classList.remove('hidden');

          document.getElementById('success-customer').textContent = document.getElementById('customer-name').textContent.replace('Hello, ', '');
          document.getElementById('success-vehicle').textContent = document.getElementById('vehicle-info').textContent;
          document.getElementById('success-date').textContent = new Date(formData.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          document.getElementById('success-time').textContent = formatTime(formData.time_slot);
          document.getElementById('success-service').textContent = document.getElementById('service-type').options[document.getElementById('service-type').selectedIndex].text;

          document.getElementById('calendar-link').href = data.booking.calendar_link;
          document.getElementById('calendar-link').textContent = '📅 Add to Google Calendar';

          showNotification('✅ Booking confirmed! Check your email.');
        } else {
          throw new Error(data.error || 'Booking failed');
        }
      } catch (error) {
        showNotification('❌ Error: ' + error.message, 'error');
        submitButton.textContent = '📅 Confirm Booking';
        submitButton.disabled = false;
      }
    });

    document.getElementById('book-another').addEventListener('click', () => location.reload());

    loadCustomer();
  </script>
</body>
</html>`;