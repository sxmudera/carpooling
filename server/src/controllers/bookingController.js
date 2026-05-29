const Booking = require('../services/Booking');
const Kendaraan = require('../services/Kendaraan');
const Pembayaran = require('../services/Pembayaran');
const User = require('../services/User');

// GET /api/booking
const getAll = async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { user_id: req.user.id };
    const data = await Booking.findAll({
      where,
      include: [
        { model: User, attributes: ['id', 'nama'] },
        { model: Kendaraan, attributes: ['id', 'nama_kendaraan', 'titik_kumpul', 'jam_berangkat', 'tanggal_berangkat', 'user_id'] },
      ],
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/booking/sebagai-host — booking untuk kendaraan milik driver ini
const getAsHost = async (req, res) => {
  try {
    // Cari semua kendaraan milik user ini
    const kendaraanku = await Kendaraan.findAll({ where: { user_id: req.user.id }, attributes: ['id'] });
    const kendaraanIds = kendaraanku.map(k => k.id);
    if (kendaraanIds.length === 0) return res.json([]);

    const { Op } = require('sequelize');
    const data = await Booking.findAll({
      where: { kendaraan_id: { [Op.in]: kendaraanIds } },
      include: [
        { model: User, attributes: ['id', 'nama', 'no_hp'] },
        { model: Kendaraan, attributes: ['id', 'nama_kendaraan', 'titik_kumpul', 'jam_berangkat', 'tanggal_berangkat'] },
      ],
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/booking/:id
const getById = async (req, res) => {
  try {
    const data = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'nama'] },
        { model: Kendaraan },
        { model: Pembayaran },
      ],
    });
    if (!data) return res.status(404).json({ message: 'Booking tidak ditemukan' });
    if (req.user.role !== 'admin' && data.user_id !== req.user.id) {
      // juga boleh kalau host dari kendaraan tsb
      const k = await Kendaraan.findByPk(data.kendaraan_id);
      if (!k || k.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Bukan booking kamu' });
      }
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/booking — buat booking (tanpa input jam, jam sudah ada di kendaraan)
const create = async (req, res) => {
  try {
    const { kendaraan_id, tanggal, jumlah_kursi = 1 } = req.body;
    if (!kendaraan_id) return res.status(400).json({ message: 'kendaraan_id wajib diisi' });

    const kendaraan = await Kendaraan.findByPk(kendaraan_id);
    if (!kendaraan) return res.status(404).json({ message: 'Kendaraan tidak ditemukan' });
    if (kendaraan.status !== 'aktif') return res.status(400).json({ message: 'Kendaraan tidak aktif' });
    if (kendaraan.user_id === req.user.id) return res.status(400).json({ message: 'Tidak bisa booking kendaraan sendiri' });

    // Tanggal diambil dari kendaraan (host yang tentukan), bukan dari input user
    const tanggalFinal = kendaraan.tanggal_berangkat || tanggal;
    if (!tanggalFinal) return res.status(400).json({ message: 'Kendaraan belum memiliki tanggal berangkat' });

    const total_harga = (kendaraan.harga_per_kursi || 0) * jumlah_kursi;
    const booking = await Booking.create({
      user_id: req.user.id, kendaraan_id, tanggal: tanggalFinal, jumlah_kursi, total_harga
    });
    res.status(201).json({ message: 'Booking berhasil, menunggu konfirmasi', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/booking/:id/status — admin update status booking
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Tidak ditemukan' });
    await booking.update({ status });
    res.json({ message: `Status booking jadi ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/booking/:id/konfirmasi-host — HOST konfirmasi booking penumpang
const konfirmasiHost = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Kendaraan }],
    });
    if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan' });
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Hanya booking pending yang bisa dikonfirmasi' });
    }
    // Hanya host (pemilik kendaraan) yang bisa konfirmasi
    if (booking.Kendaraan.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Hanya host/driver yang bisa mengkonfirmasi booking' });
    }
    await booking.update({ status: 'konfirmasi' });
    res.json({ message: 'Booking dikonfirmasi! Penumpang bisa melanjutkan.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/booking/:id/selesai — HOST menyelesaikan perjalanan
const selesaikanPerjalanan = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Kendaraan }],
    });
    if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan' });
    if (booking.status !== 'konfirmasi') {
      return res.status(400).json({ message: 'Hanya booking yang sudah dikonfirmasi bisa diselesaikan' });
    }
    // Hanya host (driver pemilik kendaraan) atau admin yang bisa selesaikan
    if (req.user.role !== 'admin' && booking.Kendaraan.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Hanya host/driver yang bisa menyelesaikan perjalanan' });
    }
    await booking.update({ status: 'selesai' });
    // Fix 4: Nonaktifkan kendaraan setelah perjalanan selesai (hilang dari daftar tersedia)
    await booking.Kendaraan.update({ status: 'nonaktif' });
    res.json({ message: 'Perjalanan diselesaikan! Kendaraan dihapus dari daftar. Penumpang sekarang bisa memberi rating.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/booking/:id/batal
const cancel = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Tidak ditemukan' });
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Bukan booking kamu' });
    }
    await booking.update({ status: 'batal' });
    res.json({ message: 'Booking dibatalkan' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/booking/:id/bayar
const bayar = async (req, res) => {
  try {
    const { metode } = req.body;
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan' });
    if (booking.user_id !== req.user.id) return res.status(403).json({ message: 'Bukan booking kamu' });

    const pembayaran = await Pembayaran.create({
      booking_id: booking.id,
      jumlah: booking.total_harga,
      metode: metode || 'cash',
      status: 'lunas',
    });
    res.status(201).json({ message: 'Pembayaran berhasil', pembayaran });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, getById, getAsHost, create, updateStatus, konfirmasiHost, selesaikanPerjalanan, cancel, bayar };