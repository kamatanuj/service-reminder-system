require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/garage_service',
  
  // SendGrid
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.FROM_EMAIL || 'noreply@yourgarage.com',
  fromName: process.env.FROM_NAME || 'Your Garage',
  
  // Google Calendar
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  
  // Base URL for deep links
  baseUrl: process.env.BASE_URL || 'https://yourdomain.com',
  
  // Admin
  adminApiKey: process.env.ADMIN_API_KEY || 'change-me-in-production',
  
  // Reminder settings
  reminderDays: 335, // Send reminder when 335 days have passed (11 months)
  bufferDays: 30, // 30-day buffer before service expires
  
  // Cron schedule (9:00 AM daily)
  cronSchedule: '0 9 * * *',
  
  // Service types
  serviceTypes: [
    { id: 'annual_service', name: 'Annual Service', duration: 2 },
    { id: 'oil_change', name: 'Oil Change', duration: 1 },
    { id: 'brake_service', name: 'Brake Service', duration: 2 },
    { id: 'tire_rotation', name: 'Tire Rotation', duration: 1 },
    { id: 'full_inspection', name: 'Full Inspection', duration: 3 }
  ]
};