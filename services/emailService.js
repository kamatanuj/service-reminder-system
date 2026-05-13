const sgMail = require('@sendgrid/mail');
const config = require('../config');

// Initialize SendGrid
sgMail.setApiKey(config.sendgridApiKey);

/**
 * Email Service
 * Handles all email communications for the service reminder system
 */
class EmailService {
  
  /**
   * Generate professional HTML email template for service reminder
   */
  generateReminderTemplate(data) {
    const { customerName, vehicle, licensePlate, daysSinceService, 
            lastServiceDate, bookingLink, serviceType } = data;
    
    const serviceTypeDisplay = serviceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Service Reminder</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #2563eb;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
          }
          .vehicle-info {
            background-color: #f3f4f6;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .vehicle-info h3 {
            margin: 0 0 10px 0;
            color: #2563eb;
            font-size: 16px;
          }
          .vehicle-info p {
            margin: 5px 0;
            color: #4b5563;
          }
          .alert-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
          .alert-box strong {
            color: #b45309;
          }
          .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .cta-button:hover {
            background-color: #1d4ed8;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .footer a {
            color: #2563eb;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 Service Reminder</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hello ${customerName},</p>
            
            <p>We hope you're enjoying your vehicle! This is a friendly reminder that your annual service is coming due.</p>
            
            <div class="vehicle-info">
              <h3>🚗 Your Vehicle Details</h3>
              <p><strong>Vehicle:</strong> ${vehicle}</p>
              <p><strong>License Plate:</strong> ${licensePlate}</p>
              <p><strong>Last Service:</strong> ${lastServiceDate}</p>
              <p><strong>Days Since Service:</strong> ${daysSinceService} days</p>
              <p><strong>Service Type:</strong> ${serviceTypeDisplay}</p>
            </div>
            
            <div class="alert-box">
              <strong>⚠️ Important:</strong> Your vehicle service is now ${daysSinceService} days overdue. 
              Regular maintenance helps ensure your vehicle's safety, performance, and longevity.
              Please book your service appointment at your earliest convenience.
            </div>
            
            <p style="text-align: center;">
              <a href="${bookingLink}" class="cta-button">📅 Book Your Service Now</a>
            </p>
            
            <p style="font-size: 14px; color: #6b7280;">
              This link is unique to your account and will pre-fill your vehicle details. 
              Alternatively, you can call us at <strong>(555) 123-4567</strong> to schedule.
            </p>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing our garage! 🛠️</p>
            <p>Need help? Contact us at <a href="mailto:support@yourgarage.com">support@yourgarage.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Generate confirmation email template
   */
  generateConfirmationTemplate(data) {
    const { customerName, vehicle, bookingDate, timeSlot, serviceType } = data;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #10b981;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
          }
          .success-icon {
            font-size: 48px;
            text-align: center;
            margin-bottom: 20px;
          }
          .details {
            background-color: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .details h3 {
            color: #047857;
            margin: 0 0 15px 0;
          }
          .details p {
            margin: 8px 0;
            color: #374151;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Confirmed!</h1>
          </div>
          <div class="content">
            <div class="success-icon">🎉</div>
            <p>Hello ${customerName},</p>
            <p>Your service appointment has been successfully booked. Here are the details:</p>
            
            <div class="details">
              <h3>📋 Appointment Details</h3>
              <p><strong>Vehicle:</strong> ${vehicle}</p>
              <p><strong>Date:</strong> ${bookingDate}</p>
              <p><strong>Time:</strong> ${timeSlot}</p>
              <p><strong>Service:</strong> ${serviceType}</p>
            </div>
            
            <p>Please arrive 10 minutes before your scheduled time. If you need to reschedule, please contact us at least 24 hours in advance.</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing our garage! 🛠️</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Send service reminder email
   */
  async sendServiceReminder(data) {
    const { to, customerName, vehicle, licensePlate, 
            daysSinceService, lastServiceDate, bookingLink, serviceType } = data;
    
    const msg = {
      to,
      from: {
        email: config.fromEmail,
        name: config.fromName
      },
      subject: `🔧 ${config.fromName} - Service Reminder for ${vehicle}`,
      text: `Hello ${customerName},\n\nYour ${vehicle} (License: ${licensePlate}) is due for service. ` +
            `It has been ${daysSinceService} days since your last service on ${lastServiceDate}.\n\n` +
            `Please book your appointment: ${bookingLink}\n\n` +
            `Thank you,\n${config.fromName}`,
      html: this.generateReminderTemplate({
        customerName,
        vehicle,
        licensePlate,
        daysSinceService,
        lastServiceDate,
        bookingLink,
        serviceType
      })
    };
    
    try {
      await sgMail.send(msg);
      console.log(`✅ Reminder email sent to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending reminder email:', error.response?.body || error.message);
      throw error;
    }
  }
  
  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(data) {
    const { to, customerName, vehicle, bookingDate, timeSlot, serviceType } = data;
    
    const msg = {
      to,
      from: {
        email: config.fromEmail,
        name: config.fromName
      },
      subject: `✅ ${config.fromName} - Booking Confirmed`,
      text: `Hello ${customerName},\n\nYour service appointment has been confirmed:\n\n` +
            `Vehicle: ${vehicle}\nDate: ${bookingDate}\nTime: ${timeSlot}\nService: ${serviceType}\n\n` +
            `Thank you,\n${config.fromName}`,
      html: this.generateConfirmationTemplate({
        customerName,
        vehicle,
        bookingDate,
        timeSlot,
        serviceType
      })
    };
    
    try {
      await sgMail.send(msg);
      console.log(`✅ Confirmation email sent to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending confirmation email:', error.response?.body || error.message);
      throw error;
    }
  }
}

module.exports = new EmailService();