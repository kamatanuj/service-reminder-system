const mongoose = require('mongoose');
const { Customer } = require('../models/Customer');

/**
 * Database Setup Script
 * Creates sample customers for testing
 */
async function setupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/garage_service', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Customer.deleteMany({});
    console.log('🗑️ Cleared existing customers');

    // Create sample customers
    const sampleCustomers = [
      {
        customer_id: 'CUST001',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@example.com',
        phone: '555-0101',
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        vehicle_year: 2020,
        license_plate: 'ABC123',
        vin_number: '1HGBH41JXMN109186',
        last_service_date: new Date('2025-06-15'), // ~11 months ago (due for service)
        service_type: 'annual_service'
      },
      {
        customer_id: 'CUST002',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.j@example.com',
        phone: '555-0102',
        vehicle_make: 'Honda',
        vehicle_model: 'Accord',
        vehicle_year: 2021,
        license_plate: 'XYZ789',
        vin_number: '1HGBH41JXMN109187',
        last_service_date: new Date('2025-05-20'), // Due for service
        service_type: 'oil_change'
      },
      {
        customer_id: 'CUST003',
        first_name: 'Michael',
        last_name: 'Brown',
        email: 'mbrown@example.com',
        phone: '555-0103',
        vehicle_make: 'Ford',
        vehicle_model: 'F-150',
        vehicle_year: 2019,
        license_plate: 'DEF456',
        vin_number: '1HGBH41JXMN109188',
        last_service_date: new Date('2025-07-01'), // Due for service
        service_type: 'brake_service'
      },
      {
        customer_id: 'CUST004',
        first_name: 'Emily',
        last_name: 'Davis',
        email: 'emily.davis@example.com',
        phone: '555-0104',
        vehicle_make: 'BMW',
        vehicle_model: 'X5',
        vehicle_year: 2022,
        license_plate: 'GHI012',
        vin_number: '1HGBH41JXMN109189',
        last_service_date: new Date('2026-02-01'), // Not due yet
        service_type: 'annual_service'
      },
      {
        customer_id: 'CUST005',
        first_name: 'Robert',
        last_name: 'Wilson',
        email: 'rwilson@example.com',
        phone: '555-0105',
        vehicle_make: 'Chevrolet',
        vehicle_model: 'Silverado',
        vehicle_year: 2018,
        license_plate: 'JKL345',
        vin_number: '1HGBH41JXMN109190',
        last_service_date: new Date('2025-04-10'), // Way overdue
        service_type: 'full_inspection'
      }
    ];

    // Insert customers
    const customers = await Customer.insertMany(sampleCustomers);
    console.log(`✅ Created ${customers.length} sample customers`);

    // Display summary
    console.log('\n📊 Customer Summary:');
    customers.forEach(c => {
      const daysSince = Math.floor((new Date() - c.last_service_date) / (1000 * 60 * 60 * 24));
      console.log(`  - ${c.full_name} (${c.vehicle_display}): ${daysSince} days since last service`);
    });

    console.log('\n🚀 Database setup complete!');
    console.log('\nTo test the reminder system:');
    console.log('  1. Start the server: npm start');
    console.log('  2. Trigger reminders: GET http://localhost:3000/api/trigger-reminders');
    console.log('     (with header: x-api-key: your-admin-api-key)');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;