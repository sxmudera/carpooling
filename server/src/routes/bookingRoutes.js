const router = require('express').Router();
const { authMiddleware, adminOnly } = require('../middlewares/authMiddleware');
const { getAll, getById, getAsHost, create, updateStatus, konfirmasiHost, selesaikanPerjalanan, cancel, bayar } = require('../controllers/bookingController');

router.get('/', authMiddleware, getAll);
router.get('/sebagai-host', authMiddleware, getAsHost);              // host lihat booking di kendaraannya
router.get('/:id', authMiddleware, getById);
router.post('/', authMiddleware, create);
router.put('/:id/status', authMiddleware, adminOnly, updateStatus);
router.put('/:id/konfirmasi-host', authMiddleware, konfirmasiHost); // host konfirmasi booking
router.put('/:id/selesai', authMiddleware, selesaikanPerjalanan);   // host selesaikan
router.put('/:id/batal', authMiddleware, cancel);
router.post('/:id/bayar', authMiddleware, bayar);

module.exports = router;