const Rating = require('../services/Rating');
const Booking = require('../services/Booking');
const Kendaraan = require('../services/Kendaraan');
const User = require('../services/User');

// POST /api/rating — penumpang beri rating ke driver setelah perjalanan selesai
const createRating = async (req, res) => {
  try {
    const { booking_id, nilai, komentar } = req.body;
    if (!booking_id || !nilai) return res.status(400).json({ message: 'booking_id dan nilai wajib' });
    if (nilai < 1 || nilai > 5) return res.status(400).json({ message: 'Nilai harus 1-5' });

    const booking = await Booking.findByPk(booking_id, {
      include: [{ model: Kendaraan }],
    });
    if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan' });
    if (booking.status !== 'selesai') return res.status(400).json({ message: 'Perjalanan belum selesai' });
    if (booking.user_id !== req.user.id) return res.status(403).json({ message: 'Bukan booking kamu' });

    // Cek sudah pernah rating belum
    const existing = await Rating.findOne({ where: { booking_id, dari_user_id: req.user.id } });
    if (existing) return res.status(400).json({ message: 'Sudah pernah memberi rating untuk booking ini' });

    const untuk_user_id = booking.Kendaraan.user_id; // driver
    const rating = await Rating.create({
      booking_id,
      dari_user_id: req.user.id,
      untuk_user_id,
      nilai,
      komentar,
    });

    // Update rata-rata rating driver
    const semuaRating = await Rating.findAll({ where: { untuk_user_id } });
    const avg = semuaRating.reduce((sum, r) => sum + r.nilai, 0) / semuaRating.length;
    await User.update({ rating: Math.round(avg * 10) / 10 }, { where: { id: untuk_user_id } });

    res.status(201).json({ message: 'Rating berhasil dikirim!', rating });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rating/driver/:user_id — lihat rating seorang driver
const getRatingDriver = async (req, res) => {
  try {
    const data = await Rating.findAll({
      where: { untuk_user_id: req.params.user_id },
      include: [{ model: User, as: 'Penilai', attributes: ['id', 'nama'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rating/check/:booking_id — cek apakah sudah rating
const checkRating = async (req, res) => {
  try {
    const existing = await Rating.findOne({
      where: { booking_id: req.params.booking_id, dari_user_id: req.user.id }
    });
    res.json({ sudah_rating: !!existing, rating: existing || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createRating, getRatingDriver, checkRating };