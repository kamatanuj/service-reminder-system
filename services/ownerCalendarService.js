/**
 * Garage Owner Calendar Service
 * Manages calendar events in the garage owner's Google Calendar
 */
const { google } = require('googleapis');

class OwnerCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.BASE_URL + '/auth/google/callback'
    );
    
    // Use owner's stored refresh token (set once during setup)
    this.oauth2Client.setCredentials({
      refresh_token: process.env.OWNER_REFRESH_TOKEN
    });
    
    this.calendar = google.calendar({
      version: 'v3',
      auth: this.oauth2Client
    });
    
    this.calendarId = process.env.OWNER_CALENDAR_ID || 'primary';
  }

  /**
   * Generate OAuth URL for garage owner setup
   * This is a ONE-TIME setup step
   */
  generateAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      prompt: 'consent',
      include_granted_scopes: true
    });
  }

  /**
   * Exchange authorization code for tokens
   * Store the refresh_token as OWNER_REFRESH_TOKEN
   */
  async exchangeCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      console.log('✅ Owner authentication successful!');
      console.log('🔑 Refresh Token (save this):', tokens.refresh_token);
      console.log('⚠️  IMPORTANT: Add this to your .env as OWNER_REFRESH_TOKEN');
      
      return {
        success: true,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiryDate: tokens.expiry_date
      };
    } catch (error) {
      console.error('❌ Error exchanging code:', error);
      throw error;
    }
  }

  /**
   * Create a service booking event in owner's calendar
   * Customer receives invite, owner sees all bookings
   */
  async createServiceEvent(data) {
    const {
      customerName,
      customerEmail,
      customerPhone,
      vehicle,
      licensePlate,
      serviceType,
      bookingDate,
      timeSlot,
      notes = ''
    } = data;

    // Parse date and time
    const [hours, minutes] = timeSlot.split(':');
    const startDateTime = new Date(`${bookingDate}T${hours}:${minutes}:00`);
    
    // Service duration based on type
    const duration = this.getServiceDuration(serviceType);
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + duration);

    // Format service type for display
    const serviceTypeDisplay = serviceType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const event = {
      summary: `🔧 ${serviceTypeDisplay}: ${vehicle} (${licensePlate})`,
      description: `
👤 Customer: ${customerName}
📧 Email: ${customerEmail}
📞 Phone: ${customerPhone}
🚗 Vehicle: ${vehicle}
🔢 License Plate: ${licensePlate}
🔧 Service Type: ${serviceTypeDisplay}
📝 Notes: ${notes || 'None'}

---
Booked via Service Reminder System
      `.trim(),
      
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: this.getTimezone()
      },
      
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: this.getTimezone()
      },
      
      // Owner is the organizer, customer gets invite
      organizer: {
        email: process.env.OWNER_EMAIL || process.env.FROM_EMAIL,
        displayName: process.env.FROM_NAME || 'Automotive Garage'
      },
      
      // Customer receives calendar invite
      attendees: [
        {
          email: customerEmail,
          displayName: customerName,
          responseStatus: 'needsAction'
        }
      ],
      
      // Reminders for both owner and customer
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },  // 1 day before
          { method: 'popup', minutes: 60 }         // 1 hour before
        ]
      },
      
      // Color code: Blue (1) for service appointments
      colorId: '1',
      
      // Location
      location: process.env.GARAGE_ADDRESS || 'Automotive Garage',
      
      // Visibility
      visibility: 'default',
      
      // Send updates to all attendees
      sendUpdates: 'all'
    };

    try {
      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        resource: event,
        sendUpdates: 'all',
        conferenceDataVersion: 1
      });

      console.log(`📅 Service event created: ${response.data.htmlLink}`);

      return {
        success: true,
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        calendarLink: response.data.htmlLink,
        icsLink: `https://calendar.google.com/calendar/ical/${this.calendarId}/events/${response.data.id}.ics`
      };
    } catch (error) {
      console.error('❌ Error creating service event:', error);
      throw error;
    }
  }

  /**
   * Get service duration in hours
   */
  getServiceDuration(serviceType) {
    const durations = {
      'annual_service': 2,
      'oil_change': 1,
      'brake_service': 2,
      'tire_rotation': 1,
      'full_inspection': 3
    };
    return durations[serviceType] || 2;
  }

  /**
   * Get timezone (default to IST for India)
   */
  getTimezone() {
    return process.env.TIMEZONE || 'Asia/Kolkata';
  }

  /**
   * Check if owner calendar is connected
   */
  async checkConnection() {
    try {
      const response = await this.calendar.calendarList.list({
        maxResults: 1
      });

      return {
        connected: true,
        calendars: response.data.items.length
      };
    } catch (error) {
      console.error('❌ Calendar not connected:', error.message);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * List upcoming bookings (for garage owner dashboard)
   */
  async getUpcomingBookings(days = 7) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    try {
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: now.toISOString(),
        timeMax: future.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        q: '🔧' // Search for service events
      });

      return response.data.items.map(event => ({
        id: event.id,
        summary: event.summary,
        start: event.start.dateTime,
        end: event.end.dateTime,
        customerEmail: event.attendees?.[0]?.email,
        customerName: event.attendees?.[0]?.displayName,
        status: event.status,
        link: event.htmlLink
      }));
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      throw error;
    }
  }

  /**
   * Cancel/delete a booking
   */
  async cancelBooking(eventId, reason = '') {
    try {
      // First, get the event to notify attendees
      const event = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId
      });

      // Update event to cancelled status
      const updatedEvent = {
        ...event.data,
        status: 'cancelled',
        description: `${event.data.description}\n\n---\n❌ CANCELLED: ${reason}`
      };

      await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        resource: updatedEvent,
        sendUpdates: 'all'
      });

      console.log(`📅 Booking cancelled: ${eventId}`);

      return {
        success: true,
        eventId: eventId,
        status: 'cancelled'
      };
    } catch (error) {
      console.error('❌ Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(eventId, newDate, newTimeSlot) {
    try {
      const [hours, minutes] = newTimeSlot.split(':');
      const newStart = new Date(`${newDate}T${hours}:${minutes}:00`);
      
      // Get existing event
      const event = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId
      });

      // Calculate new end time based on existing duration
      const oldStart = new Date(event.data.start.dateTime);
      const oldEnd = new Date(event.data.end.dateTime);
      const duration = (oldEnd - oldStart) / (1000 * 60 * 60); // hours
      
      const newEnd = new Date(newStart);
      newEnd.setHours(newEnd.getHours() + duration);

      // Update event
      const updatedEvent = {
        ...event.data,
        start: {
          dateTime: newStart.toISOString(),
          timeZone: this.getTimezone()
        },
        end: {
          dateTime: newEnd.toISOString(),
          timeZone: this.getTimezone()
        }
      };

      const response = await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        resource: updatedEvent,
        sendUpdates: 'all'
      });

      console.log(`📅 Booking rescheduled: ${eventId}`);

      return {
        success: true,
        eventId: eventId,
        newStartTime: newStart.toISOString(),
        calendarLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('❌ Error rescheduling booking:', error);
      throw error;
    }
  }
}

module.exports = new OwnerCalendarService();