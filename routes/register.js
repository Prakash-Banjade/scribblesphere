const router = require('express').Router()
const registerUser = require('../controllers/userRegisterController')

router.post('/', registerUser)

module.exports = router