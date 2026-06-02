const mongoose = require('mongoose');

const simVerificationSchema = new mongoose.Schema({
  user_id: { type: Number, required: true, index: true },
  jenis: { type: String, enum: ['SIM', 'STNK'], required: true },
  nomor: { type: String },
  mimeType: { type: String },
  filename: { type: String },
  documentBase64: { type: String, required: true },
  status: { type: String, enum: ['pending', 'terverifikasi', 'ditolak'], default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SimVerification', simVerificationSchema);

