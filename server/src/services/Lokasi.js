const mongoose = require('mongoose');

// Titik kumpul kendaraan
const lokasiSchema = new mongoose.Schema({
  kendaraan_id: { type: Number, required: true, unique: true },
  nama_titik:   { type: String, required: true },
  latitude:     { type: Number, required: true },
  longitude:    { type: Number, required: true },
  updatedAt:    { type: Date, default: Date.now },
});

// Live tracking GPS per booking/perjalanan
const liveTrackingSchema = new mongoose.Schema({
  kendaraan_id:  { type: Number, required: true, unique: true },
  booking_id:    { type: Number, required: false },
  latitude:      { type: Number, required: true },
  longitude:     { type: Number, required: true },
  status:        { type: String, enum: ['menuju_titik', 'dalam_perjalanan', 'selesai'], default: 'dalam_perjalanan' },
  updatedAt:     { type: Date, default: Date.now },
});

module.exports = {
  Lokasi: mongoose.model('Lokasi', lokasiSchema),
  LiveTracking: mongoose.model('LiveTracking', liveTrackingSchema),
};