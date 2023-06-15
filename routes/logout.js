const router = require('express').Router()
const userLogoutController = require('../controllers/userLogoutController.js')

router.post('/', userLogoutController)

module.exports = router