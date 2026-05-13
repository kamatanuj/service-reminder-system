# Service Reminder & Booking System 🚗🔧

**Automated Service Reminder & Booking System for automotive garages.**

## 📖 Overview

This system automatically monitors customer service dates, sends email reminders when service is due (335+ days since last service), and provides one-click booking with Google Calendar integration.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Automated Reminders** | Daily cron job scans for customers with 335+ days since last service |
| **Spam Prevention** | `email_sent_flag` prevents duplicate email reminders |
| **One-Click Booking** | UUID-based deep links for secure, pre-filled booking forms |
| **Google Calendar** | Auto-creates calendar events with email/popup reminders |
| **Professional Emails** | Responsive HTML templates with booking buttons |
| **Admin Dashboard** | Statistics and manual trigger endpoints |

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB
- SendGrid account (for emails)
- Google Cloud account (for Calendar)

### 1. Clone & Install
```bash
git clone https://github.com/kamatanuj/service-reminder-system.git
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

**Server will start at:** http://localhost:3001 (Port 3001 to avoid conflicts)

## 📁 Project Structure

```
service-reminder-system/
├── server.js                 # Express server & API routes
├── config.js                 # Configuration management
├── models/
│   └── Customer.js           # Mongoose schemas (Customer + Booking)
├── services/
│   ├── reminderService.js    # Reminder logic (335-day trigger)
│   ├── emailService.js       # SendGrid HTML email templates
│   └── calendarService.js    # Google Calendar API integration
├── public/
│   └── booking.html          # Modern Tailwind CSS booking form
├── scripts/
│   └── setupDatabase.js      # Sample data setup
├── .env.example              # Environment template
└── README.md                 # Documentation
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/customer/:uuid` | GET | Get customer details (pre-fills booking) |
| `/api/available-slots?date=YYYY-MM-DD` | GET | Get available time slots |
| `/api/booking/:uuid` | POST | Submit booking |
| `/api/trigger-reminders` | GET | Manually trigger reminders (admin) |
| `/api/stats` | GET | Dashboard statistics |

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `SENDGRID_API_KEY` | SendGrid API key | ✅ |
| `FROM_EMAIL` | Sender email address | ✅ |
| `FROM_NAME` | Sender display name | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | ✅ |
| `GOOGLE_REFRESH_TOKEN` | Google refresh token | ✅ |
| `GOOGLE_CALENDAR_ID` | Calendar ID (default: primary) | ✅ |
| `PORT` | Server port (default: 3001) | ⚠️ Change if 3000 is in use |
| `ADMIN_API_KEY` | Admin API key | ✅ |

## 📧 Email Flow

1. **Scan** → System finds customers with 335+ days since last service
2. **Email** → Professional HTML reminder sent with unique booking link
3. **Click** → Customer clicks link → pre-filled booking form
4. **Book** → Selects date/time → availability checked
5. **Confirm** → Google Calendar event created
6. **Notify** → Confirmation email sent with calendar link

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB + Mongoose
- **Email**: SendGrid API
- **Calendar**: Google Calendar API
- **Scheduler**: node-cron
- **Frontend**: Tailwind CSS (CDN)
- **Security**: Helmet, CORS, Rate Limiting

## 📊 System Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Customer   │────▶│  Booking Form   │────▶│  Google     │
│  (Email)    │     │  (UUID-based)   │     │  Calendar   │
└─────────────┘     └─────────────────┘     └─────────────┘
       │                                           │
       │     ┌─────────────────┐                   │
       └────▶│  Express Server │◀──────────────────┘
             │  (Node.js)      │
             └─────────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌──────────┐
    │ MongoDB │  │SendGrid │  │  Cron    │
    │         │  │  Email  │  │ (Daily)  │
    └─────────┘  └─────────┘  └──────────┘
```

## 🔧 Reminder Logic

```javascript
// Trigger: Current Date - Last Service Date >= 335 days
// This provides a 30-day buffer before annual service expires
const reminderDate = new Date();
reminderDate.setDate(reminderDate.getDate() - 335); // ~11 months

// Only send if:
// - email_sent_flag is false
// - booking_status is not 'booked' or 'completed'
```

## 📜 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Built with ❤️ for automotive service professionals.**