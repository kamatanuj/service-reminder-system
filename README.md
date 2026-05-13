# Service Reminder & Booking System 🚗🔧

Automated Service Reminder & Booking System for automotive garages.

## Features ✨

- **Automated Reminders**: Scans database daily for customers due for service (335+ days since last service)
- **Spam Prevention**: Email flag system prevents duplicate reminders
- **One-Click Booking**: UUID-based deep links for secure, pre-filled booking forms
- **Google Calendar Integration**: Auto-creates calendar events with reminders
- **Professional Email Templates**: Responsive HTML emails with booking links
- **Admin Dashboard**: Statistics and manual trigger endpoints

## Quick Start 🚀

### 1. Clone & Install
```bash
git clone <repository-url>
cd service-reminder-system
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Setup Database
```bash
npm run setup-db
```

### 4. Start Server
```bash
npm start
```

### 5. Test Reminders
```bash
curl -H "x-api-key: your-admin-api-key" http://localhost:3000/api/trigger-reminders
```

## API Endpoints 📡

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/customer/:uuid` | GET | Get customer details |
| `/api/available-slots` | GET | Get available time slots |
| `/api/booking/:uuid` | POST | Submit booking |
| `/api/trigger-reminders` | GET | Manually trigger reminders (admin) |
| `/api/reset-flags` | POST | Reset all email flags (admin) |
| `/api/stats` | GET | Dashboard statistics |

## Project Structure 📁

```
service-reminder-system/
├── config.js              # Configuration
├── server.js              # Express server & API routes
├── package.json           # Dependencies
├── .env.example           # Environment template
├── models/
│   └── Customer.js        # Mongoose schemas
├── services/
│   ├── reminderService.js # Reminder logic
│   ├── emailService.js    # SendGrid emails
│   └── calendarService.js # Google Calendar
├── public/
│   └── booking.html       # Booking form UI
└── scripts/
    └── setupDatabase.js   # Sample data setup
```

## Environment Variables 🔐

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `SENDGRID_API_KEY` | SendGrid API key |
| `FROM_EMAIL` | Sender email address |
| `FROM_NAME` | Sender name |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Google refresh token |
| `GOOGLE_CALENDAR_ID` | Calendar ID (default: primary) |
| `ADMIN_API_KEY` | Admin API key |
| `BASE_URL` | Application base URL |

## License 📄

MIT
