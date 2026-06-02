const router = require('express').Router();
const { authMiddleware, adminOnly } = require('../middlewares/authMiddleware');
const {
  uploadSimDocument,
  listSimDocuments,
  verifySimDocument
} = require('../controllers/simVerificationController');

router.get('/', authMiddleware, adminOnly, listSimDocuments);
router.post('/', authMiddleware, uploadSimDocument);
router.put('/:id/verifikasi', authMiddleware, adminOnly, verifySimDocument);

module.exports = router;

