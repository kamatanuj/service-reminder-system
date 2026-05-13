const { google } = require('googleapis');
const config = require('../config');

/**
 * Google Calendar Service
 * Creates and manages calendar events for service bookings
 */
class CalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      'http://localhost:3000/auth/google/callback'
    );
    
    this.oauth2Client.setCredentials({
      refresh_token: config.googleRefreshToken
    });
    
    this.calendar = google.calendar({
      version: 'v3',
      auth: this.oauth2Client
    });
  }
  
  /**
   * Create a calendar event for a service booking
   */
  async createEvent(data) {
    const { 
      customerName, 
      vehicle, 
      licensePlate, 
      serviceType, 
      bookingDate, 
      timeSlot,
      email,
      phone,
      notes = ''
    } = data;
    
    // Parse date and time
    const [hours, minutes] = timeSlot.split(':');
    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
    
    // Service typically takes 2 hours
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 2);
    
    const event = {
      summary: `🔧 Service: ${vehicle} (${licensePlate})`,
      description: `
👤 Customer: ${customerName}
📧 Email: ${email}
📞 Phone: ${phone}
🚗 Vehicle: ${vehicle}
🔢 License Plate: ${licensePlate}
🔧 Service Type: ${serviceType}
📝 Notes: ${notes || 'None'}
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York' // Adjust to your timezone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York'
      },
      attendees: [
        { email }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 } // 1 hour before
        ]
      },
      colorId: '1' // Blue color for service appointments
    };
    
    try {
      const response = await this.calendar.events.insert({
        calendarId: config.googleCalendarId,
        resource: event,
        sendUpdates: 'all'
      });
      
      console.log(`📅 Calendar event created: ${response.data.htmlLink}`);
      
      return {
        success: true,
        eventId: response.data.id,
        eventLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('❌ Error creating calendar event:', error.message);
      throw error;
    }
  }
  
  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId, data) {
    try {
      const response = await this.calendar.events.patch({
        calendarId: config.googleCalendarId,
        eventId: eventId,
        resource: data
      });
      
      console.log(`📅 Calendar event updated: ${response.data.id}`);
      
      return {
        success: true,
        eventId: response.data.id
      };
    } catch (error) {
      console.error('❌ Error updating calendar event:', error.message);
      throw error;
    }
  }
  
  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId) {
    try {
      await this.calendar.events.delete({
        calendarId: config.googleCalendarId,
        eventId: eventId
      });
      
      console.log(`📅 Calendar event deleted: ${eventId}`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting calendar event:', error.message);
      throw error;
    }
  }
  
  /**
   * Get available time slots for a date
   * Checks existing events to avoid conflicts
   */
  async getAvailableSlots(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0); // 8 AM
    
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0); // 6 PM
    
    try {
      const response = await this.calendar.events.list({
        calendarId: config.googleCalendarId,
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      const bookedSlots = response.data.items.map(event => {
        const start = new Date(event.start.dateTime);
        return `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
      });
      
      // All possible slots (every 2 hours)
      const allSlots = [
        '08:00', '10:00', '12:00', '14:00', '16:00'
      ];
      
      // Filter out booked slots
      const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
      
      return availableSlots;
    } catch (error) {
      console.error('❌ Error getting available slots:', error.message);
      throw error;
    }
  }
}

module.exports = new CalendarService();