const router = require('express').Router();
const { authMiddleware, adminOnly } = require('../middlewares/authMiddleware');
const {
  getAllLokasi,
  getLokasi,
  setLokasi,
  deleteLokasi,
  updateLiveTracking,
  getAllLiveTracking,
  getLiveTracking,
  stopLiveTracking
} = require('../controllers/lokasiController');

// Titik kumpul
router.get('/live', authMiddleware, adminOnly, getAllLiveTracking);
router.get('/live/:kendaraan_id', authMiddleware, getLiveTracking);                  // penumpang lihat
router.post('/live/update', authMiddleware, updateLiveTracking);                     // driver update posisi
router.delete('/live/:kendaraan_id', authMiddleware, stopLiveTracking);              // stop tracking

router.get('/', authMiddleware, adminOnly, getAllLokasi);
router.get('/:kendaraan_id', getLokasi);                                              // publik
router.post('/', authMiddleware, setLokasi);                                          // driver
router.delete('/:kendaraan_id', authMiddleware, adminOnly, deleteLokasi);             // admin

module.exports = router;