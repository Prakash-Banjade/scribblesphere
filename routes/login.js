const router = require('express').Router()
const loginUser = require('../controllers/userLoginController.js')

router.post('/', loginUser)

module.exports = router