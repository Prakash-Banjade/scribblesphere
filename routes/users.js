const router = require('express').Router()
const {getAllUsers, getUserById, deleteUser} = require('../controllers/usersController.js')
const verifyJWTs = require('../middlewares/verifyJWTs.js')

router.use(verifyJWTs)
router.get('/:id', getUserById)

router.route('/')
    .get( getAllUsers)
    .delete(deleteUser)


module.exports = router