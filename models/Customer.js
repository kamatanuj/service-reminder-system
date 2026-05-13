const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Customer Schema
const customerSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  uuid: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
    index: true
  },
  first_name: {
    type: String,
    required: true,
    trim: true
  },
  last_name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  // Vehicle Information
  vehicle_make: {
    type: String,
    required: true,
    trim: true
  },
  vehicle_model: {
    type: String,
    required: true,
    trim: true
  },
  vehicle_year: {
    type: Number,
    required: true
  },
  license_plate: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  vin_number: {
    type: String,
    trim: true,
    uppercase: true
  },
  // Service Information
  last_service_date: {
    type: Date,
    required: true
  },
  next_service_date: {
    type: Date,
    required: true
  },
  service_type: {
    type: String,
    enum: ['annual_service', 'oil_change', 'brake_service', 'tire_rotation', 'full_inspection'],
    default: 'annual_service'
  },
  // Email Tracking
  email_sent_flag: {
    type: Boolean,
    default: false,
    index: true
  },
  email_sent_date: {
    type: Date,
    default: null
  },
  email_reminder_count: {
    type: Number,
    default: 0
  },
  // Booking Status
  booking_status: {
    type: String,
    enum: ['pending', 'booked', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  booked_date: {
    type: Date,
    default: null
  },
  booked_time_slot: {
    type: String,
    default: null
  },
  google_calendar_event_id: {
    type: String,
    default: null
  },
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
customerSchema.index({ last_service_date: 1, email_sent_flag: 1 });
customerSchema.index({ next_service_date: 1 });
customerSchema.index({ booking_status: 1 });

// Virtual for full name
customerSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// Virtual for vehicle display
customerSchema.virtual('vehicle_display').get(function() {
  return `${this.vehicle_year} ${this.vehicle_make} ${this.vehicle_model}`;
});

// Method to check if service is due (within 30 days of next service)
customerSchema.methods.isServiceDue = function() {
  const today = new Date();
  const daysUntilService = Math.ceil((this.next_service_date - today) / (1000 * 60 * 60 * 24));
  return daysUntilService <= 30 && daysUntilService >= 0;
};

// Method to check if reminder should be sent
customerSchema.methods.shouldSendReminder = function() {
  if (this.email_sent_flag) return false;
  return this.isServiceDue();
};

// Method to generate deep link
customerSchema.methods.getDeepLink = function(baseUrl) {
  return `${baseUrl}/booking/${this.uuid}`;
};

// Method to mark email as sent
customerSchema.methods.markEmailSent = function() {
  this.email_sent_flag = true;
  this.email_sent_date = new Date();
  this.email_reminder_count += 1;
};

// Method to reset email flag after service
customerSchema.methods.resetAfterService = function() {
  this.email_sent_flag = false;
  this.email_sent_date = null;
  this.booking_status = 'pending';
  this.booked_date = null;
  this.booked_time_slot = null;
  this.google_calendar_event_id = null;
};

// Pre-save middleware to update next_service_date based on last_service_date
customerSchema.pre('save', function(next) {
  if (this.isModified('last_service_date')) {
    // Set next service date to 1 year from last service
    const nextDate = new Date(this.last_service_date);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    this.next_service_date = nextDate;
  }
  next();
});

const Customer = mongoose.model('Customer', customerSchema);

// Booking Schema (for tracking completed bookings)
const bookingSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  booking_date: {
    type: Date,
    required: true
  },
  time_slot: {
    type: String,
    required: true
  },
  service_type: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  google_calendar_event_id: {
    type: String
  },
  confirmation_email_sent: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = {
  Customer,
  Booking
};