const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const { Customer, Booking } = require('./models/Customer');
const reminderService = require('./services/reminderService');
const emailService = require('./services/emailService');
const calendarService = require('./services/calendarService');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (booking form)
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(config.mongodbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get customer by UUID (for pre-filling booking form)
app.get('/api/customer/:uuid', async (req, res) => {
  try {
    const customer = await Customer.findOne({ uuid: req.params.uuid });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({
      customer_id: customer.customer_id,
      uuid: customer.uuid,
      full_name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      vehicle_display: customer.vehicle_display,
      vehicle_make: customer.vehicle_make,
      vehicle_model: customer.vehicle_model,
      vehicle_year: customer.vehicle_year,
      license_plate: customer.license_plate,
      last_service_date: customer.last_service_date,
      service_type: customer.service_type,
      booking_status: customer.booking_status
    });
  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new customer
app.post('/api/customers', async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    
    res.status(201).json({
      success: true,
      customer: {
        customer_id: customer.customer_id,
        uuid: customer.uuid,
        full_name: customer.full_name,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Get available time slots for a date
app.get('/api/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' });
    }
    
    const slots = await calendarService.getAvailableSlots(date);
    
    res.json({
      date,
      available_slots: slots
    });
  } catch (error) {
    console.error('❌ Error getting available slots:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

// Submit booking
app.post('/api/booking/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { booking_date, time_slot, service_type, notes } = req.body;
    
    // Find customer
    const customer = await Customer.findOne({ uuid });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    if (customer.booking_status === 'booked') {
      return res.status(400).json({ error: 'Customer already has a booking' });
    }
    
    // Create Google Calendar event
    const calendarResult = await calendarService.createEvent({
      customerName: customer.full_name,
      vehicle: customer.vehicle_display,
      licensePlate: customer.license_plate,
      serviceType: service_type || customer.service_type,
      bookingDate,
      timeSlot,
      email: customer.email,
      phone: customer.phone,
      notes
    });
    
    // Update customer
    customer.booking_status = 'booked';
    customer.booked_date = new Date(bookingDate);
    customer.booked_time_slot = timeSlot;
    customer.google_calendar_event_id = calendarResult.eventId;
    customer.last_service_date = new Date(bookingDate); // Update last service date
    
    await customer.save();
    
    // Create booking record
    const booking = new Booking({
      customer_id: customer._id,
      booking_date: new Date(bookingDate),
      time_slot: timeSlot,
      service_type: service_type || customer.service_type,
      notes,
      google_calendar_event_id: calendarResult.eventId
    });
    
    await booking.save();
    
    // Send confirmation email
    await emailService.sendBookingConfirmation({
      to: customer.email,
      customerName: customer.full_name,
      vehicle: customer.vehicle_display,
      bookingDate,
      timeSlot,
      serviceType: service_type || customer.service_type
    });
    
    // Reset email flag for next cycle
    customer.email_sent_flag = false;
    customer.email_sent_date = null;
    await customer.save();
    
    res.json({
      success: true,
      message: 'Booking confirmed!',
      booking: {
        customer_id: customer.customer_id,
        booking_date: bookingDate,
        time_slot: timeSlot,
        calendar_link: calendarResult.eventLink
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing booking:', error);
    res.status(500).json({ error: 'Failed to process booking' });
  }
});

// Manually trigger reminder scan (admin only)
app.get('/api/trigger-reminders', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey !== config.adminApiKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const results = await reminderService.processReminders();
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('❌ Error triggering reminders:', error);
    res.status(500).json({ error: 'Failed to trigger reminders' });
  }
});

// Reset all email flags (admin only - for testing)
app.post('/api/reset-flags', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey !== config.adminApiKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const result = await reminderService.resetAllFlags();
    
    res.json({
      success: true,
      message: `Reset ${result.modifiedCount} customer flags`,
      result
    });
  } catch (error) {
    console.error('❌ Error resetting flags:', error);
    res.status(500).json({ error: 'Failed to reset flags' });
  }
});

// Get dashboard statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const dueForService = await Customer.countDocuments({
      email_sent_flag: false,
      booking_status: { $nin: ['booked', 'completed'] }
    });
    const bookingsThisMonth = await Booking.countDocuments({
      booking_date: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });
    const emailsSent = await Customer.countDocuments({ email_sent_flag: true });
    
    res.json({
      total_customers: totalCustomers,
      due_for_service: dueForService,
      bookings_this_month: bookingsThisMonth,
      emails_sent: emailsSent
    });
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// ============================================
// CRON JOB - Daily Reminder Check
// ============================================

// Schedule: Every day at 9:00 AM
const scheduledTask = cron.schedule(config.cronSchedule, async () => {
  console.log('\n⏰ Running scheduled reminder check...\n');
  
  try {
    await reminderService.processReminders();
    console.log('✅ Scheduled reminder check complete\n');
  } catch (error) {
    console.error('❌ Scheduled reminder check failed:', error);
  }
}, {
  scheduled: true,
  timezone: 'America/New_York' // Adjust to your timezone
});

// Start the cron job
scheduledTask.start();

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`\n🚀 Service Reminder System running on port ${PORT}`);
  console.log(`📅 Environment: ${config.nodeEnv}`);
  console.log(`⏰ Daily reminder check scheduled for: ${config.cronSchedule}`);
  console.log(`🔗 Booking URL: ${config.baseUrl}/booking/:uuid\n`);
});

module.exports = app;