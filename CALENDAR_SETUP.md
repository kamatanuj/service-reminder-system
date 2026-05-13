# 📅 Calendar Integration Implementation Guide

## Two Options Available

### Option 1: cal.com (Recommended - Easiest)
**Best for:** Quick setup, no OAuth complexity, professional booking widget

### Option 2: Garage Owner Google Calendar
**Best for:** Full control, all bookings in owner's calendar, customer gets invite

---

## Option 1: cal.com Implementation

### Step 1: Sign Up
1. Go to https://cal.com
2. Create account (use garage owner email)
3. Verify email

### Step 2: Set Up Event Type
1. Click "New Event Type"
2. Set:
   - **Title:** "Vehicle Service"
   - **Duration:** 2 hours
   - **URL:** `vehicle-service`
   - **Description:** "Book your vehicle service appointment"
3. Configure availability:
   - Mon-Fri: 8:00 AM - 6:00 PM
   - Sat: 10:00 AM - 4:00 PM
   - Sun: Closed
4. Save

### Step 3: Get API Key
1. Go to Settings → Developer
2. Click "Generate API Key"
3. Copy the key

### Step 4: Configure Environment
```env
# cal.com Settings
CALCOM_API_KEY=your_calcom_api_key
CALCOM_USERNAME=your-calcom-username
CALCOM_EVENT_SLUG=vehicle-service
```

### Step 5: Update Booking Flow
```javascript
// In your booking handler:
const calcomService = require('./services/calcomService');

// After customer submits booking:
const calcomLink = calcomService.generateBookingLink(customerData, bookingDetails);

// Redirect customer to cal.com:
res.redirect(calcomLink);
```

### Step 6: Handle Webhooks
1. In cal.com → Settings → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/calcom`
3. Select events: Booking Created, Rescheduled, Cancelled

### ✅ Benefits
- Professional booking widget
- Automatic email confirmations
- No OAuth setup
- Built-in rescheduling
- Free tier available (unlimited bookings)
- Auto-syncs with owner calendar (Google/Outlook)

---

## Option 2: Garage Owner Google Calendar

### Step 1: Google Cloud Console
1. Go to https://console.cloud.google.com
2. Create new project (e.g., "Garage Calendar")
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Name: "Service Reminder System"
   - Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
5. Download client credentials
6. Copy Client ID and Client Secret

### Step 2: Environment Variables
```env
# Google Calendar (Owner)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
OWNER_REFRESH_TOKEN=will_get_this_next
OWNER_CALENDAR_ID=primary
OWNER_EMAIL=garage@example.com
FROM_NAME=Your Garage Name
```

### Step 3: One-Time Owner Setup
1. Start server: `npm start`
2. Open browser: `http://localhost:3001/admin/setup-calendar`
3. Click "Connect Google Calendar"
4. Sign in with **garage owner's Google account**
5. Grant calendar permissions
6. Copy the refresh token shown
7. Add to `.env`: `OWNER_REFRESH_TOKEN=copied_token`
8. Restart server

### Step 4: Test Calendar
```bash
curl http://localhost:3001/admin/calendar-status
```

### Step 5: How Bookings Work Now
```
Customer Books Service
     ↓
Server creates event in OWNER's calendar
     ↓
Owner sees booking in their Google Calendar
     ↓
Customer receives calendar invite email
     ↓
Both get reminder notifications
```

### ✅ Benefits
- All bookings in owner's calendar
- Owner sees everything at a glance
- Customer gets proper Google Calendar invite
- Full control over events
- Can cancel/reschedule from calendar
- No third-party service dependency

---

## Comparison

| Feature | cal.com | Google Calendar |
|---------|---------|-----------------|
| Setup Time | 10 minutes | 30 minutes |
| OAuth Required | No | Yes (one-time) |
| Booking Widget | ✅ Built-in | ❌ Custom needed |
| Email Confirmations | ✅ Automatic | ❌ Custom needed |
| Rescheduling | ✅ Built-in | ✅ Via API |
| Cost | Free tier | Free |
| Professional Look | ⭐⭐⭐ | ⭐⭐ |
| Owner Control | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Customer Experience | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## Recommended Setup

### For Quick Launch (Today):
**Use cal.com** - Set up in 10 minutes, professional booking experience

### For Full Control (Later):
**Migrate to Google Calendar** - Full owner calendar integration

---

## Implementation Priority

### Phase 1: cal.com (Immediate)
1. [ ] Create cal.com account
2. [ ] Configure event type
3. [ ] Get API key
4. [ ] Update .env
5. [ ] Test booking flow
6. [ ] Deploy

### Phase 2: Google Calendar (Future)
1. [ ] Google Cloud Console setup
2. [ ] OAuth implementation
3. [ ] Owner setup flow
4. [ ] Calendar event creation
5. [ ] Admin dashboard
6. [ ] Migrate from cal.com

---

## Updated Environment Variables

```env
# ==========================================
# Option 1: cal.com (Choose this for quick setup)
# ==========================================
CALCOM_API_KEY=cal_live_xxxxxxxxxxxxxxxx
CALCOM_USERNAME=your-garage-name
CALCOM_EVENT_SLUG=vehicle-service

# ==========================================
# Option 2: Google Calendar (Choose this for full control)
# ==========================================
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxx
OWNER_REFRESH_TOKEN=1//xxxxxxxx
OWNER_CALENDAR_ID=primary
OWNER_EMAIL=owner@garage.com

# Common Settings
FROM_NAME=Your Garage Name
FROM_EMAIL=bookings@yourgarage.com
BASE_URL=https://service-reminder.kamatanuj.workers.dev
```

---

## Testing

### Test cal.com Integration:
```bash
# 1. Check connection
curl http://localhost:3001/api/health

# 2. Create test booking
curl -X POST http://localhost:3001/api/booking/test-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "booking_date": "2026-05-20",
    "time_slot": "10:00",
    "service_type": "annual_service"
  }'
```

### Test Google Calendar:
```bash
# 1. Check calendar connection
curl http://localhost:3001/admin/calendar-status

# 2. View upcoming bookings
curl http://localhost:3001/admin/upcoming-bookings?days=7
```

---

## Need Help?

1. **cal.com issues** → Check https://cal.com/support
2. **Google OAuth issues** → Check https://developers.google.com/calendar
3. **Our code issues** → Check logs: `npm start` output

---

## Next Steps

**Which option do you want to implement?**

- **cal.com**: Quick, professional, easiest
- **Google Calendar**: Full control, all in owner's calendar

Let me know and I'll help you set it up! 🚀