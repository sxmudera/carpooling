const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
  kendaraan_id: { type: Number, required: true, index: true },
  type: { type: String, enum: ['gps_update', 'log', 'route'], default: 'gps_update' },
  latitude: { type: Number },
  longitude: { type: Number },
  aktivitas: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TrackingEvent', trackingEventSchema);

