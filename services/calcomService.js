/**
 * cal.com Integration Service
 * Handles booking widget and API integration
 */
class CalcomService {
  constructor() {
    this.apiKey = process.env.CALCOM_API_KEY;
    this.baseUrl = 'https://api.cal.com/v1';
    this.username = process.env.CALCOM_USERNAME || 'your-username';
    this.eventSlug = process.env.CALCOM_EVENT_SLUG || 'vehicle-service';
  }

  /**
   * Generate cal.com booking link with pre-filled data
   */
  generateBookingLink(customerData, bookingDetails) {
    const { full_name, email, phone, vehicle_display } = customerData;
    const { booking_date, time_slot, service_type } = bookingDetails;

    // Parse date and time
    const [hours, minutes] = time_slot.split(':');
    const bookingDateTime = new Date(`${booking_date}T${hours}:${minutes}:00`);
    
    // cal.com uses ISO format for dates
    const dateParam = bookingDateTime.toISOString();

    // Build cal.com booking URL with prefilled data
    const params = new URLSearchParams({
      date: dateParam,
      // Pre-fill guest information
      name: full_name,
      email: email,
      // Custom fields for vehicle info
      'metadata[vehicle]': vehicle_display,
      'metadata[phone]': phone,
      'metadata[service]': service_type
    });

    // cal.com direct booking link format
    // Format: https://cal.com/username/event-slug?date=2026-05-20T10:00:00.000Z
    return `https://cal.com/${this.username}/${this.eventSlug}?${params.toString()}`;
  }

  /**
   * Generate embeddable cal.com widget HTML
   */
  generateWidgetHTML(customerData, bookingDetails) {
    const bookingUrl = this.generateBookingLink(customerData, bookingDetails);

    return `
      <div style="width: 100%; height: 600px; overflow: hidden;"
        data-cal-link="${this.username}/${this.eventSlug}"
        data-cal-config='${JSON.stringify({
          layout: "month_view",
          theme: "light",
          hideEventTypeDetails: false
        })}'>
        <iframe 
          src="${bookingUrl}&embed=true"
          style="width: 100%; height: 100%; border: none;"
          loading="lazy"
        ></iframe>
      </div>
    `;
  }

  /**
   * Fetch available slots from cal.com API
   */
  async getAvailableSlots(startDate, endDate) {
    try {
      const response = await fetch(
        `${this.baseUrl}/availability?apiKey=${this.apiKey}&eventTypeId=${this.eventSlug}&startTime=${startDate}&endTime=${endDate}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`cal.com API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform cal.com slots to our format
      return data.slots.map(slot => ({
        time: slot.time,
        available: slot.available
      }));
    } catch (error) {
      console.error('❌ Error fetching cal.com slots:', error);
      throw error;
    }
  }

  /**
   * Create booking via cal.com API
   */
  async createBooking(bookingData) {
    try {
      const response = await fetch(
        `${this.baseUrl}/bookings?apiKey=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eventTypeId: parseInt(this.eventSlug),
            start: bookingData.startTime,
            end: bookingData.endTime,
            name: bookingData.customerName,
            email: bookingData.customerEmail,
            guests: [],
            metadata: {
              vehicle: bookingData.vehicle,
              service: bookingData.serviceType,
              notes: bookingData.notes
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`cal.com booking error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error creating cal.com booking:', error);
      throw error;
    }
  }

  /**
   * Handle cal.com webhooks
   */
  async handleWebhook(payload) {
    const { type, payload: eventData } = payload;

    switch (type) {
      case 'BOOKING_CREATED':
        return {
          status: 'confirmed',
          bookingId: eventData.bookingId,
          calendarLink: eventData.metadata?.videoCallUrl,
          startTime: eventData.startTime,
          endTime: eventData.endTime
        };

      case 'BOOKING_RESCHEDULED':
        return {
          status: 'rescheduled',
          bookingId: eventData.bookingId,
          newStartTime: eventData.startTime
        };

      case 'BOOKING_CANCELLED':
        return {
          status: 'cancelled',
          bookingId: eventData.bookingId
        };

      default:
        return { status: 'unknown', type };
    }
  }

  /**
   * Get calendar sync status
   */
  async getCalendarStatus() {
    try {
      const response = await fetch(
        `${this.baseUrl}/me?apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`cal.com API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        connected: true,
        username: data.username,
        defaultCalendar: data.defaultScheduleId,
        timezone: data.timeZone
      };
    } catch (error) {
      console.error('❌ Error checking cal.com status:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = new CalcomService();