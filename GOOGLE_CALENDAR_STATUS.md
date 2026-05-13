# Service Reminder & Booking System - Google Calendar Integration

## 📅 Status: READY FOR OWNER SETUP

### Current Implementation

✅ **Booking system works** with "Add to Google Calendar" button  
✅ **API endpoints** ready for automatic calendar integration  
✅ **Owner setup flow** implemented (`/admin/setup-calendar`)  
⚠️ **Needs:** Garage owner to complete Google OAuth setup

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| **Live System** | https://service-reminder.kamatanuj.workers.dev |
| **GitHub** | https://github.com/kamatanuj/service-reminder-system |
| **Setup Calendar** | https://service-reminder.kamatanuj.workers.dev/admin/setup-calendar |

---

## 🎯 How Google Calendar Integration Works

### Current Flow (Manual)
```
Customer Books → Gets Calendar Link → Owner Clicks to Add
```

### Full Flow (After Owner Setup)
```
Customer Books → Auto-creates in Owner's Calendar → Owner Sees It → Customer Gets Invite
```

---

## 📋 Implementation Complete

### Files Created/Updated

| File | Purpose |
|------|---------|
| `services/ownerCalendarService.js` | Google Calendar API integration |
| `routes/calendarSetup.js` | OAuth routes & admin endpoints |
| `index.js` | Updated booking API with calendar links |
| `CALENDAR_SETUP.md` | Full implementation guide |
| `GOOGLE_CALENDAR_SETUP.md` | Quick setup guide |

---

## 🚀 Next Steps (Required)

### Step 1: Get Google OAuth Credentials

1. Go to https://console.cloud.google.com
2. Create project: "Service Reminder System"
3. Enable **Google Calendar API**
4. Create OAuth 2.0 credentials:
   - Type: Web application
   - Redirect URI: `https://service-reminder.kamatanuj.workers.dev/auth/google/callback`

### Step 2: Set Environment Variables

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
OWNER_REFRESH_TOKEN=from_setup_below
OWNER_EMAIL=garage.owner@example.com
GARAGE_NAME=Your Garage Name
```

### Step 3: Owner Authentication

1. Visit: https://service-reminder.kamatanuj.workers.dev/admin/setup-calendar
2. Click "Connect Google Calendar"
3. Sign in with garage owner's Google account
4. Grant permissions
5. Copy refresh token to `.env`

### Step 4: Test

```bash
curl https://service-reminder.kamatanuj.workers.dev/admin/calendar-status
```

---

## 🏗️ System Architecture

```
Customer Booking Form
       ↓
POST /api/booking/:uuid
       ↓
Create Booking in Database
       ↓
Create Event in Owner's Calendar (via Google API)
       ↓
Send Email to Customer (confirmation)
       ↓
Owner Sees Booking in Google Calendar
       ↓
Customer Receives Calendar Invite
```

---

## 📊 Current Features

### Without Owner Setup
- ✅ Booking form works
- ✅ Time slots load
- ✅ Database stores bookings
- ✅ "Add to Calendar" button (manual)

### With Owner Setup (Full Integration)
- ✅ Automatic calendar events
- ✅ Owner sees all bookings
- ✅ Customer receives invites
- ✅ Email reminders (1 day + 1 hour)
- ✅ Reschedule/cancel from calendar
- ✅ Upcoming bookings dashboard

---

## 🔄 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/setup-calendar` | GET | Start owner OAuth setup |
| `/auth/google/callback` | GET | OAuth callback (stores token) |
| `/admin/calendar-status` | GET | Check calendar connection |
| `/admin/upcoming-bookings` | GET | View owner's bookings |
| `/admin/cancel-booking` | POST | Cancel a booking |
| `/admin/reschedule-booking` | POST | Reschedule booking |

---

## 📝 Configuration

### Environment Variables Required

```env
# Google Calendar (Owner)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
OWNER_REFRESH_TOKEN=xxx
OWNER_CALENDAR_ID=primary
OWNER_EMAIL=owner@example.com

# Garage Info
GARAGE_NAME=Your Garage
GARAGE_ADDRESS=123 Main St

# Email
SENDGRID_API_KEY=xxx
FROM_EMAIL=noreply@example.com
FROM_NAME=Your Garage

# Base URL
BASE_URL=https://service-reminder.kamatanuj.workers.dev
```

---

## 🎯 Summary

**The system is ready for Google Calendar integration.**

**What's needed:**
1. Google Cloud Console project setup
2. OAuth credentials
3. Owner authentication (one-time)
4. Refresh token added to environment

**After setup:**
- All customer bookings automatically appear in owner's Google Calendar
- Customer receives calendar invite email
- Both get reminder notifications
- Owner can manage bookings from any device

---

*Updated: 2026-05-13*
*Status: Implementation Complete - Awaiting Owner Setup*