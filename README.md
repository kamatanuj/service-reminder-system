# Service Reminder & Booking System

Automated automotive garage service reminder and booking system.

## Architecture
- Node.js + Express backend
- MongoDB database
- Google Calendar API integration
- SendGrid email service
- UUID-based deep links
- Cron job automation

## Features
- Scans customer database for services due
- Sends professional HTML reminder emails
- Mobile-responsive booking form (Tailwind CSS)
- Auto-creates Google Calendar events
- Spam prevention with email_sent_flag

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run the application
npm start
```

## API Endpoints
- `POST /api/customers` - Add new customer
- `GET /api/booking/:uuid` - Get booking form (pre-filled)
- `POST /api/booking/:uuid` - Submit booking
- `GET /api/trigger-reminders` - Manually trigger reminder scan

## Scheduled Jobs
- Daily at 9:00 AM: Scan for due services and send reminders

## Environment Variables
See `.env.example` for required configuration.
