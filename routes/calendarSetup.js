/**
 * Owner Calendar Setup Route
 * One-time setup for garage owner to connect their Google Calendar
 */
const express = require('express');
const router = express.Router();
const ownerCalendarService = require('../services/ownerCalendarService');

/**
 * Step 1: Start Owner Calendar Setup
 * GET /admin/setup-calendar
 * 
 * This redirects the garage owner to Google OAuth consent screen
 * After authorization, Google redirects to /auth/google/callback
 */
router.get('/admin/setup-calendar', (req, res) => {
  try {
    const authUrl = ownerCalendarService.generateAuthUrl();
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Setup Garage Calendar</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px;
            background: #f5f5f5;
          }
          .card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #333; }
          .btn {
            display: inline-block;
            padding: 15px 30px;
            background: #4285f4;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            margin-top: 20px;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            color: #856404;
          }
          .steps {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .steps ol { margin: 10px 0; padding-left: 20px; }
          .steps li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🔧 Setup Garage Owner Calendar</h1>
          
          <p>Connect your Google Calendar to automatically receive all customer bookings.</p>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This is a one-time setup. Make sure you're logged into the <strong>garage owner's Google account</strong> before clicking the button below.
          </div>
          
          <div class="steps">
            <strong>What happens next:</strong>
            <ol>
              <li>Click "Connect Google Calendar"</li>
              <li>Sign in with the garage owner's Google account</li>
              <li>Grant calendar access permission</li>
              <li>Copy the refresh token shown on the next page</li>
              <li>Add it to your .env file as OWNER_REFRESH_TOKEN</li>
            </ol>
          </div>
          
          <a href="${authUrl}" class="btn">📅 Connect Google Calendar</a>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            <strong>Note:</strong> After setup, all customer bookings will automatically appear in this Google Calendar.
          </p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

/**
 * Step 2: OAuth Callback
 * GET /auth/google/callback?code=...
 * 
 * Google redirects here after owner authorizes access
 * Displays the refresh token that must be saved
 */
router.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ 
      error: 'Authorization code missing',
      message: 'Please try the setup again'
    });
  }
  
  try {
    const result = await ownerCalendarService.exchangeCode(code);
    
    if (result.success && result.refreshToken) {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Calendar Setup Complete ✅</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px;
              background: #f5f5f5;
            }
            .card {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #28a745; }
            .token-box {
              background: #f8f9fa;
              border: 2px solid #28a745;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              font-family: monospace;
              word-break: break-all;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              color: #856404;
            }
            .btn {
              display: inline-block;
              padding: 10px 20px;
              background: #28a745;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✅ Calendar Connected Successfully!</h1>
            
            <p>Your Google Calendar is now connected to the Service Reminder System.</p>
            
            <div class="warning">
              <strong>🔑 IMPORTANT - Save This Token:</strong>
              <p>Copy the refresh token below and add it to your <code>.env</code> file:</p>
            </div>
            
            <div class="token-box">
              OWNER_REFRESH_TOKEN=${result.refreshToken}
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Open your <code>.env</code> file</li>
              <li>Add the line above</li>
              <li>Restart your server</li>
              <li>All customer bookings will now appear in your calendar!</li>
            </ol>
            
            <a href="/" class="btn">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    } else {
      res.status(400).json({
        error: 'Setup incomplete',
        message: 'No refresh token received. Please ensure you granted offline access.'
      });
    }
  } catch (error) {
    console.error('❌ Error in OAuth callback:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h1 style="color: #dc3545;">❌ Setup Failed</h1>
        <p>Error: ${error.message}</p>
        <p>Please try again by visiting <a href="/admin/setup-calendar">/admin/setup-calendar</a></p>
      </body>
      </html>
    `);
  }
});

/**
 * Check Calendar Connection Status
 * GET /admin/calendar-status
 */
router.get('/admin/calendar-status', async (req, res) => {
  try {
    const status = await ownerCalendarService.checkConnection();
    
    res.json({
      success: true,
      connected: status.connected,
      message: status.connected 
        ? '✅ Owner calendar is connected and ready'
        : '❌ Owner calendar not connected. Visit /admin/setup-calendar to connect.',
      details: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Upcoming Bookings (Owner Dashboard)
 * GET /admin/upcoming-bookings?days=7
 */
router.get('/admin/upcoming-bookings', async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  
  try {
    const bookings = await ownerCalendarService.getUpcomingBookings(days);
    
    res.json({
      success: true,
      days: days,
      count: bookings.length,
      bookings: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Cancel a Booking
 * POST /admin/cancel-booking
 * Body: { eventId, reason }
 */
router.post('/admin/cancel-booking', async (req, res) => {
  const { eventId, reason } = req.body;
  
  if (!eventId) {
    return res.status(400).json({
      success: false,
      error: 'eventId is required'
    });
  }
  
  try {
    const result = await ownerCalendarService.cancelBooking(eventId, reason);
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      eventId: result.eventId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reschedule a Booking
 * POST /admin/reschedule-booking
 * Body: { eventId, newDate, newTimeSlot }
 */
router.post('/admin/reschedule-booking', async (req, res) => {
  const { eventId, newDate, newTimeSlot } = req.body;
  
  if (!eventId || !newDate || !newTimeSlot) {
    return res.status(400).json({
      success: false,
      error: 'eventId, newDate, and newTimeSlot are required'
    });
  }
  
  try {
    const result = await ownerCalendarService.rescheduleBooking(eventId, newDate, newTimeSlot);
    
    res.json({
      success: true,
      message: 'Booking rescheduled successfully',
      newStartTime: result.newStartTime,
      calendarLink: result.calendarLink
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;