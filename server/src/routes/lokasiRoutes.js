const router = require('express').Router();
const { authMiddleware, adminOnly } = require('../middlewares/authMiddleware');
const { getLokasi, setLokasi, deleteLokasi, updateLiveTracking, getLiveTracking, stopLiveTracking } = require('../controllers/lokasiController');

// Titik kumpul
router.get('/:kendaraan_id', getLokasi);                                              // publik
router.post('/', authMiddleware, setLokasi);                                          // driver
router.delete('/:kendaraan_id', authMiddleware, adminOnly, deleteLokasi);             // admin

// Live tracking
router.post('/live/update', authMiddleware, updateLiveTracking);                     // driver update posisi
router.get('/live/:kendaraan_id', authMiddleware, getLiveTracking);                  // penumpang lihat
router.delete('/live/:kendaraan_id', authMiddleware, stopLiveTracking);              // stop tracking

module.exports = router;