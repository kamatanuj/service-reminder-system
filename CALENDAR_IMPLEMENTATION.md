# Calendar Integration Options

## Option 1: cal.com Integration (Recommended)

**Why cal.com?**
- Easy booking widget embed
- Automatic calendar sync
- No Google OAuth complexity
- Free tier available

### Implementation Steps

1. **Sign up at cal.com**
   - Go to https://cal.com
   - Create account as garage owner
   - Set up your availability (Mon-Fri 8AM-6PM)
   - Create event type: "Vehicle Service"
   - Set duration: 2 hours
   - Get your event link: `https://cal.com/yourname/vehicle-service`

2. **Get API Key**
   - Settings → Developer → API Keys
   - Generate new key
   - Store in environment variables

3. **Install SDK**
   ```bash
   npm install @calcom/sdk
   ```

4. **Update Booking Logic**
   - Instead of creating Google Calendar event, redirect to cal.com
   - Pre-fill customer details via URL parameters
   - After booking, cal.com auto-adds to garage owner calendar

5. **Webhook Setup**
   - Configure webhook to receive booking confirmations
   - Update your database with booking status

---

## Option 2: Garage Owner Google Calendar

**How it works:**
- Garage owner authenticates once (OAuth)
- All customer bookings added to owner's calendar
- Customer gets invite link

### Implementation Steps

1. **Google Cloud Console**
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3001/auth/google/callback` as redirect URI
   - Enable Google Calendar API
   - Get Client ID and Client Secret

2. **Owner Authentication Flow**
   ```javascript
   // One-time setup for garage owner
   app.get('/admin/setup-calendar', (req, res) => {
     const authUrl = oauth2Client.generateAuthUrl({
       access_type: 'offline',
       scope: ['https://www.googleapis.com/auth/calendar'],
       prompt: 'consent'
     });
     res.redirect(authUrl);
   });
   ```

3. **Store Owner's Refresh Token**
   ```javascript
   // After owner authorizes
   app.get('/auth/google/callback', async (req, res) => {
     const { tokens } = await oauth2Client.getToken(req.query.code);
     // Save tokens.refresh_token to database as owner's token
     // This is used for ALL future calendar operations
   });
   ```

4. **Create Events as Owner**
   ```javascript
   // Use owner's stored credentials
   oauth2Client.setCredentials({
     refresh_token: ownerRefreshToken // From DB
   });
   
   // Create event in owner's calendar
   calendar.events.insert({
     calendarId: 'primary', // Owner's primary calendar
     auth: oauth2Client,
     resource: event
   });
   ```

5. **Send Invite to Customer**
   ```javascript
   // Add customer as attendee
   attendees: [
     { email: ownerEmail },    // Garage owner (required)
     { email: customerEmail }  // Customer (gets invite)
   ]
   ```

---

## Option 3: Simple iCal Links (No API)

**Quick solution without API integration:**
- Generate `.ics` file
- Customer downloads and imports to their calendar
- Garage owner manually adds to their calendar

### Implementation

```javascript
function generateICS(eventData) {
  return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDate(eventData.start)}
DTEND:${formatDate(eventData.end)}
SUMMARY:Vehicle Service: ${eventData.vehicle}
DESCRIPTION:Service Type: ${eventData.serviceType}
LOCATION:Automotive Garage
END:VEVENT
END:VCALENDAR`;
}
```

---

## Recommended Approach: cal.com

**Why?**
1. ✅ No OAuth complexity
2. ✅ Built-in availability management
3. ✅ Automatic timezone handling
4. ✅ Email notifications built-in
5. ✅ Rescheduling/cancellation handled
6. ✅ Free tier sufficient for small garage
7. ✅ Professional booking widget
8. ✅ Syncs with owner's Google/Outlook calendar

---

## Implementation Plan

### Phase 1: cal.com Integration (Quick)
1. Create cal.com account
2. Set up event types
3. Update booking API to redirect to cal.com
4. Add webhook handler

### Phase 2: Garage Owner Calendar (Later)
1. Implement OAuth flow for owner
2. Store owner tokens securely
3. Auto-create events in owner calendar
4. Send invites to customers

---

## Updated Booking Flow with cal.com

```
Customer Clicks Link
     ↓
Pre-filled Booking Form
     ↓
Select Date/Time
     ↓
Click "Confirm Booking"
     ↓
Redirect to cal.com widget
     ↓
cal.com handles:
  - Calendar availability check
  - Booking confirmation
  - Email to customer
  - Add to owner calendar
     ↓
Webhook to our server
     ↓
Update booking status in DB
```

---

## Environment Variables Needed

```env
# Option 1: cal.com
CALCOM_API_KEY=your_calcom_api_key
CALCOM_EVENT_TYPE_ID=your_event_type_id
CALCOM_USERNAME=your_calcom_username

# Option 2: Google Calendar (Owner)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OWNER_REFRESH_TOKEN=owner_stored_refresh_token
OWNER_CALENDAR_ID=primary
```

---

## Next Steps

1. Which option do you prefer?
2. If cal.com - create account and I'll update the code
3. If Google Calendar - we need owner OAuth setup

Let me know which you'd like to proceed with!