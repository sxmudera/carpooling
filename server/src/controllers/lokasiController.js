const { Lokasi, LiveTracking } = require('../services/Lokasi');
const Kendaraan = require('../services/Kendaraan');
const RiwayatLokasi = require('../services/RiwayatLokasi');
const TrackingEvent = require('../services/TrackingEvent');

const getAllLokasi = async (req, res) => {
  try {
    const data = await Lokasi.find().sort({ updatedAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lokasi/:kendaraan_id — lihat titik kumpul kendaraan
const getLokasi = async (req, res) => {
  try {
    const lokasi = await Lokasi.findOne({ kendaraan_id: parseInt(req.params.kendaraan_id) });
    if (!lokasi) return res.status(404).json({ message: 'Lokasi belum diset' });
    res.json(lokasi);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lokasi — driver set titik kumpul kendaraannya
const setLokasi = async (req, res) => {
  try {
    const { kendaraan_id, nama_titik, latitude, longitude } = req.body;
    if (!kendaraan_id || !nama_titik || latitude == null || longitude == null) {
      return res.status(400).json({ message: 'Semua field wajib' });
    }
    const lokasi = await Lokasi.findOneAndUpdate(
      { kendaraan_id },
      { nama_titik, latitude, longitude, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Titik kumpul disimpan', lokasi });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lokasi/:kendaraan_id — admin hapus lokasi
const deleteLokasi = async (req, res) => {
  try {
    await Lokasi.deleteOne({ kendaraan_id: parseInt(req.params.kendaraan_id) });
    res.json({ message: 'Lokasi dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── LIVE TRACKING ─────────────────────────────────────────────────────────

// POST /api/lokasi/live — driver update posisi real-time
const updateLiveTracking = async (req, res) => {
  try {
    const { kendaraan_id, latitude, longitude, status } = req.body;
    if (!kendaraan_id || latitude == null || longitude == null) {
      return res.status(400).json({ message: 'kendaraan_id, latitude, longitude wajib' });
    }
    // Pastikan kendaraan milik driver ini
    const kendaraan = await Kendaraan.findByPk(kendaraan_id);
    if (!kendaraan) return res.status(404).json({ message: 'Kendaraan tidak ditemukan' });
    if (kendaraan.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bukan kendaraan kamu' });
    }

    const tracking = await LiveTracking.findOneAndUpdate(
      { kendaraan_id },
      {
        latitude,
        longitude,
        status: status || 'dalam_perjalanan',
        updatedAt: new Date()
      },
      {
        upsert: true,
        new: true
      }
    );

    await TrackingEvent.create({
      kendaraan_id,
      type: 'gps_update',
      latitude,
      longitude,
      aktivitas: `GPS Update (${latitude}, ${longitude})`
    });

    await RiwayatLokasi.create({
      kendaraan_id,
      latitude,
      longitude,
      createdAt: new Date()
    });

    res.json({ message: 'Posisi diupdate', tracking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lokasi/live/:kendaraan_id — penumpang lihat posisi driver
const getLiveTracking = async (req, res) => {
  try {
    const tracking = await LiveTracking.findOne({ kendaraan_id: parseInt(req.params.kendaraan_id) });
    if (!tracking) return res.status(404).json({ message: 'Driver belum mulai tracking' });
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllLiveTracking = async (req, res) => {
  try {
    const data = await LiveTracking.find().sort({ updatedAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lokasi/live/:kendaraan_id — hapus live tracking saat selesai
const stopLiveTracking = async (req, res) => {
  try {
    const kendaraan_id = parseInt(req.params.kendaraan_id, 10);
    const tracking = await LiveTracking.findOneAndUpdate(
      { kendaraan_id },
      { status: 'selesai', updatedAt: new Date() },
      { new: true }
    );
    if (!tracking) return res.status(404).json({ message: 'Live tracking tidak ditemukan' });

    res.json({ message: 'Live tracking dihentikan', tracking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllLokasi,
  getLokasi,
  setLokasi,
  deleteLokasi,
  updateLiveTracking,
  getAllLiveTracking,
  getLiveTracking,
  stopLiveTracking
};