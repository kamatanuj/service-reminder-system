# 🔧 Google Calendar Setup for Garage Owner

## Quick Setup Guide

### Step 1: Get Google OAuth Credentials

1. Go to https://console.cloud.google.com
2. Create a new project (name: "Service Reminder System")
3. Enable **Google Calendar API**
   - APIs & Services → Library → Search "Google Calendar API" → Enable
4. Create OAuth 2.0 Credentials
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Name: "Service Reminder System"
   - Authorized redirect URIs: `https://service-reminder.kamatanuj.workers.dev/auth/google/callback`
   - Click Create
5. Copy your **Client ID** and **Client Secret**

### Step 2: Set Environment Variables

Update your `.env` file:
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
BASE_URL=https://service-reminder.kamatanuj.workers.dev
```

### Step 3: Authenticate Garage Owner

1. Visit: `https://service-reminder.kamatanuj.workers.dev/admin/setup-calendar`
2. Click "Connect Google Calendar"
3. Sign in with the **garage owner's Google account**
4. Grant calendar permissions
5. Copy the **refresh token** shown on screen
6. Add it to your `.env`:
```env
OWNER_REFRESH_TOKEN=1//xxxxxxxxxxxxx
```

### Step 4: Test the Setup

```bash
curl https://service-reminder.kamatanuj.workers.dev/admin/calendar-status
```

Should return:
```json
{
  "connected": true,
  "message": "✅ Owner calendar is connected and ready"
}
```

## How It Works Now

**When a customer books a service:**
1. System automatically creates event in owner's Google Calendar
2. Owner sees booking immediately in their calendar
3. Customer receives Google Calendar invite email
4. Both get reminder notifications (1 day + 1 hour before)

## Owner Benefits

- ✅ All bookings in one calendar
- ✅ Automatic notifications
- ✅ Can reschedule/cancel from calendar app
- ✅ See all appointments at a glance
- ✅ No manual entry needed

## Files Added

- `services/ownerCalendarService.js` - Calendar integration
- `routes/calendarSetup.js` - OAuth routes
- `CALENDAR_SETUP.md` - Full documentation

## Need Help?

Check `CALENDAR_SETUP.md` for detailed troubleshooting.

---

## ⚠️ IMPORTANT

**The garage owner MUST complete the OAuth setup for calendar integration to work.**

Without the owner's refresh token:
- Bookings still save in database
- But NO calendar events are created
- Owner must manually add bookings to calendar

With the owner's refresh token:
- ✅ Automatic calendar events
- ✅ Customer invites
- ✅ Reminder notifications
- ✅ Reschedule/cancel from calendar

**Make sure to run `/admin/setup-calendar` as the garage owner!**