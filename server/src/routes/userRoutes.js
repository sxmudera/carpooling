const router = require('express').Router();
const { authMiddleware, adminOnly } = require('../middlewares/authMiddleware');
const {
  getUsers, getUserById, updateUser, deleteUser,
  uploadSimStnk, verifikasiSimStnk
} = require('../controllers/userController');

router.get('/', authMiddleware, getUsers);                                         // GET  /api/users
router.get('/:id', authMiddleware, adminOnly, getUserById);                        // GET  /api/users/:id
router.put('/:id', authMiddleware, updateUser);                                    // PUT  /api/users/:id
router.delete('/:id', authMiddleware, adminOnly, deleteUser);                      // DELETE /api/users/:id
router.post('/sim-stnk', authMiddleware, uploadSimStnk);                           // POST /api/users/sim-stnk
router.put('/sim-stnk/:id/verifikasi', authMiddleware, adminOnly, verifikasiSimStnk); // PUT /api/users/sim-stnk/:id/verifikasi

module.exports = router;
