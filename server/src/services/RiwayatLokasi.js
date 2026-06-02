const mongoose = require('mongoose');

const riwayatLokasiSchema = new mongoose.Schema({
  kendaraan_id: {
    type: Number,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  'RiwayatLokasi',
  riwayatLokasiSchema
);