# Google Cloud Console Setup Guide

## Step-by-Step Instructions

---

## Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Sign in with your Google account
3. Click **"Select a project"** (top left)
4. Click **"NEW PROJECT"**
5. Fill in:
   - **Project name:** `Service Reminder System`
   - **Organization:** (leave as default)
   - **Location:** (leave as default)
6. Click **"CREATE"**
7. Wait for project to be created (takes a few seconds)

---

## Step 2: Enable Google Calendar API

1. Make sure your new project is selected (check dropdown at top)
2. Click **"APIs & Services"** → **"Library"** (left sidebar)
3. Search for **"Google Calendar API"**
4. Click on **"Google Calendar API"** in results
5. Click **"ENABLE"**
6. Wait for API to be enabled

---

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"** (left sidebar)
2. Select **"External"** (for testing) or **"Internal"** (if using Google Workspace)
3. Click **"CREATE"**
4. Fill in:
   - **App name:** `Service Reminder System`
   - **User support email:** your-email@gmail.com
   - **App logo:** (optional, skip for now)
   - **Developer contact email:** your-email@gmail.com
5. Click **"SAVE AND CONTINUE"**
6. Click **"ADD OR REMOVE SCOPES"**
7. Search for these scopes and check them:
   - ✅ `.../auth/calendar` (View and manage your calendars)
   - ✅ `.../auth/calendar.events` (View and manage your calendar events)
8. Click **"UPDATE"**
9. Click **"SAVE AND CONTINUE"**
10. Click **"ADD USERS"** (for testing)
    - Add your email address
    - Click **"ADD"**
11. Click **"SAVE AND CONTINUE"**
12. Review and click **"BACK TO DASHBOARD"**

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"** (left sidebar)
2. Click **"CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Select:
   - **Application type:** `Web application`
   - **Name:** `Service Reminder Web App`
4. Under **"Authorized redirect URIs"** click **"ADD URI"**
   - Add: `https://service-reminder.kamatanuj.workers.dev/auth/google/callback`
5. Click **"CREATE"**
6. **IMPORTANT:** 
   - A popup will show your **Client ID** and **Client Secret**
   - Click **"DOWNLOAD JSON"** to save them
   - Also copy them somewhere safe
7. Click **"OK"**

---

## Step 5: Get Your Credentials

After creating credentials, you'll have:

```
Client ID:     123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
Client Secret: xxxxxxxxxxxxxxxx
```

**Save these!** You'll need them for the next step.

---

## Step 6: Update Environment Variables

Add these to your `.env` file:

```env
# Google Calendar API (from Step 5)
GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxx

# Garage owner email
OWNER_EMAIL=your-email@gmail.com

# Other settings
GARAGE_NAME=Your Garage Name
GARAGE_ADDRESS=123 Main Street, City
BASE_URL=https://service-reminder.kamatanuj.workers.dev
```

---

## Step 7: Authenticate Garage Owner

1. Visit: https://service-reminder.kamatanuj.workers.dev/admin/setup-calendar
2. Click **"Connect Google Calendar"**
3. Sign in with the **garage owner's Google account**
4. Click **"Allow"** when asked for permissions
5. You'll be redirected back with an authorization code
6. Copy the **refresh token** shown on screen
7. Add it to `.env`:

```env
OWNER_REFRESH_TOKEN=1//xxxxxxxxxxxxxxxx
```

---

## Required Permissions (Scopes)

The system needs these Google Calendar permissions:

| Scope | What It Does | Why Needed |
|-------|-------------|------------|
| `https://www.googleapis.com/auth/calendar` | View and manage calendars | Create events in owner calendar |
| `https://www.googleapis.com/auth/calendar.events` | Manage calendar events | Add/modify event details |

**What the system CAN do:**
- ✅ Create events in owner's calendar
- ✅ Send calendar invites to customers
- ✅ Set reminders (1 day + 1 hour before)
- ✅ Add event details (customer name, vehicle, service type)
- ✅ Reschedule/cancel events

**What the system CANNOT do:**
- ❌ See other events in owner's calendar (unless same calendar)
- ❌ Delete owner events (only ones it created)
- ❌ Access other Google services
- ❌ Read owner emails

---

## Step 8: Test the Integration

After setup, test with:

```bash
# Check calendar connection
curl https://service-reminder.kamatanuj.workers.dev/admin/calendar-status

# Should return:
# {
#   "success": true,
#   "connected": true,
#   "message": "✅ Owner calendar is connected and ready"
# }
```

---

## Troubleshooting

### Error: "This app isn't verified"
- You're in testing mode
- Click **"Advanced"** → **"Go to Service Reminder System (unsafe)"**
- This is normal for development/testing

### Error: "redirect_uri_mismatch"
- Double-check the redirect URI in Google Cloud Console
- Must match exactly: `https://service-reminder.kamatanuj.workers.dev/auth/google/callback`
- No trailing slashes, exact match

### Error: "Invalid client"
- Client ID or Secret is wrong
- Check for extra spaces or missing characters
- Re-copy from Google Cloud Console

### Error: "insufficient permissions"
- Go back to OAuth consent screen
- Make sure you added the scopes
- Save and wait a few minutes for propagation

---

## Security Notes

⚠️ **IMPORTANT:**
1. Never commit `.env` file to GitHub
2. Keep Client Secret private
3. Refresh token is like a password - keep it secure
4. Add `.env` to `.gitignore`
5. In production, use a secure secret manager

---

## Next Steps After Setup

1. ✅ Google Cloud project created
2. ✅ Google Calendar API enabled
3. ✅ OAuth consent screen configured
4. ✅ OAuth credentials created
5. ✅ Environment variables set
6. ✅ Owner authenticated
7. ⏳ Deploy with updated environment

**After all steps:**
- Customer books service → Auto-creates in owner calendar
- Owner sees all bookings in Google Calendar
- Customer receives calendar invite
- Both get reminder notifications

---

**Need help?** Check the full documentation in `CALENDAR_SETUP.md`

**Questions?** Let me know which step you're on! 🚀