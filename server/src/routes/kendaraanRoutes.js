const router = require('express').Router();
const { authMiddleware, adminOnly } = require('../middlewares/authMiddleware');
const { getAll, getById, create, update, remove } = require('../controllers/kendaraanController');

router.get('/', getAll);                            // GET    /api/kendaraan (publik)
router.get('/:id', getById);                        // GET    /api/kendaraan/:id (publik)
router.post('/', authMiddleware, create);            // POST   /api/kendaraan
router.put('/:id', authMiddleware, update);          // PUT    /api/kendaraan/:id
router.delete('/:id', authMiddleware, remove);       // DELETE /api/kendaraan/:id

module.exports = router;
