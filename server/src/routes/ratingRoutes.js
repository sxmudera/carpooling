const router = require('express').Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { createRating, getRatingDriver, checkRating } = require('../controllers/ratingController');

router.post('/', authMiddleware, createRating);                     // POST /api/rating
router.get('/driver/:user_id', getRatingDriver);                    // GET  /api/rating/driver/:id (publik)
router.get('/check/:booking_id', authMiddleware, checkRating);      // GET  /api/rating/check/:booking_id

module.exports = router;