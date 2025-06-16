const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Tech Conference 2025'
  },
  date: {
    type: Date,
    required: true,
    default: new Date('2025-06-01')
  },
  location: {
    type: String,
    required: true,
    default: 'Pune'
  },
  eventType: {
    type: String,
    enum: ['Outdoor Sports', 'Wedding', 'Conference', 'Other'],
    required: true
  },
  description: {
    type: String,
    default: 'An annual conference focusing on technology trends and innovations.'
  }
});

module.exports = mongoose.model('Event', eventSchema);
