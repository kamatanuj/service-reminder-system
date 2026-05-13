const { Customer } = require('../models/Customer');
const emailService = require('../services/emailService');
const calendarService = require('../services/calendarService');
const config = require('../config');

/**
 * Service Reminder System
 * Identifies customers whose service is due and sends reminder emails
 */
class ReminderService {
  
  /**
   * Find customers whose service is due for reminders
   * Current Date - Last Service Date >= 335 days (approx. 11 months)
   * This provides a 30-day buffer before the annual service expires
   */
  async findCustomersForReminders() {
    try {
      const today = new Date();
      const reminderDate = new Date(today);
      reminderDate.setDate(reminderDate.getDate() - 335); // 335 days ago = ~11 months
      
      console.log(`🔍 Scanning for services due since: ${reminderDate.toISOString().split('T')[0]}`);
      console.log(`📅 Current date: ${today.toISOString().split('T')[0]}`);
      
      // Find customers:
      // 1. Last service was 335+ days ago (11+ months)
      // 2. Email has NOT been sent yet for this cycle
      // 3. Not currently booked or completed
      const customers = await Customer.find({
        last_service_date: {
          $lte: reminderDate // Service was done 335+ days ago
        },
        email_sent_flag: false, // Not yet emailed this cycle
        booking_status: {
          $nin: ['booked', 'completed'] // Not already booked
        }
      }).sort({ last_service_date: 1 }); // Oldest first
      
      console.log(`✅ Found ${customers.length} customers due for service reminders`);
      
      // Log details for debugging
      if (customers.length > 0) {
        customers.forEach(c => {
          const daysSinceService = Math.floor((today - c.last_service_date) / (1000 * 60 * 60 * 24));
          console.log(`  - ${c.full_name}: ${daysSinceService} days since last service`);
        });
      }
      
      return customers;
    } catch (error) {
      console.error('❌ Error finding customers for reminders:', error);
      throw error;
    }
  }
  
  /**
   * Send reminder email to a customer
   */
  async sendReminderEmail(customer) {
    try {
      const daysSinceService = Math.floor(
        (new Date() - customer.last_service_date) / (1000 * 60 * 60 * 24)
      );
      
      // Generate deep link with UUID
      const deepLink = customer.getDeepLink(config.baseUrl);
      
      // Send the email
      await emailService.sendServiceReminder({
        to: customer.email,
        customerName: customer.full_name,
        vehicle: customer.vehicle_display,
        licensePlate: customer.license_plate,
        daysSinceService,
        lastServiceDate: customer.last_service_date.toISOString().split('T')[0],
        bookingLink: deepLink,
        serviceType: customer.service_type
      });
      
      // Mark email as sent
      customer.markEmailSent();
      await customer.save();
      
      console.log(`📧 Reminder email sent to ${customer.email} (${customer.full_name})`);
      
      return {
        success: true,
        customerId: customer.customer_id,
        email: customer.email,
        sentAt: new Date()
      };
    } catch (error) {
      console.error(`❌ Error sending reminder to ${customer.email}:`, error);
      return {
        success: false,
        customerId: customer.customer_id,
        email: customer.email,
        error: error.message
      };
    }
  }
  
  /**
   * Process all due reminders
   */
  async processReminders() {
    console.log('\n🚀 Starting Service Reminder Process...\n');
    
    try {
      // Find customers needing reminders
      const customers = await this.findCustomersForReminders();
      
      if (customers.length === 0) {
        console.log('📭 No customers need reminders today.');
        return {
          processed: 0,
          sent: 0,
          failed: 0,
          details: []
        };
      }
      
      const results = {
        processed: customers.length,
        sent: 0,
        failed: 0,
        details: []
      };
      
      // Send emails to each customer
      for (const customer of customers) {
        const result = await this.sendReminderEmail(customer);
        
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
        }
        
        results.details.push(result);
        
        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`\n✅ Reminder process complete:`);
      console.log(`   - Total customers: ${results.processed}`);
      console.log(`   - Emails sent: ${results.sent}`);
      console.log(`   - Failed: ${results.failed}`);
      
      return results;
    } catch (error) {
      console.error('❌ Error processing reminders:', error);
      throw error;
    }
  }
  
  /**
   * Reset email flags for testing (admin only)
   */
  async resetAllFlags() {
    try {
      const result = await Customer.updateMany(
        {},
        {
          $set: {
            email_sent_flag: false,
            email_sent_date: null
          }
        }
      );
      
      console.log(`🔄 Reset email flags for ${result.modifiedCount} customers`);
      return result;
    } catch (error) {
      console.error('❌ Error resetting flags:', error);
      throw error;
    }
  }
}

module.exports = new ReminderService();