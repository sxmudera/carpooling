const SimVerification = require('../services/SimVerification');
const User = require('../services/User');

const uploadSimDocument = async (req, res) => {
  try {
    const { jenis, nomor, mimeType, filename, documentBase64 } = req.body;

    if (!jenis || !documentBase64) {
      return res.status(400).json({ message: 'Jenis dan dokumen wajib' });
    }
    if (!['SIM', 'STNK'].includes(jenis)) {
      return res.status(400).json({ message: 'Jenis harus SIM atau STNK' });
    }

    const doc = await SimVerification.create({
      user_id: req.user.id,
      jenis,
      nomor: nomor || null,
      mimeType: mimeType || null,
      filename: filename || null,
      documentBase64,
      status: 'pending'
    });

    await User.update({ sim_verified: false }, { where: { id: req.user.id } });

    res.status(201).json({ message: 'Dokumen dikirim, menunggu verifikasi admin', doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listSimDocuments = async (req, res) => {
  try {
    const docs = await SimVerification.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifySimDocument = async (req, res) => {
  try {
    const { status_verifikasi } = req.body;
    if (!['terverifikasi', 'ditolak'].includes(status_verifikasi)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const doc = await SimVerification.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Dokumen tidak ditemukan' });

    doc.status = status_verifikasi;
    await doc.save();

    if (status_verifikasi === 'terverifikasi') {
      await User.update({ sim_verified: true }, { where: { id: doc.user_id } });
    }

    res.json({ message: `Dokumen ${status_verifikasi}`, doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { uploadSimDocument, listSimDocuments, verifySimDocument };

