const router = require('express').Router()
const refreshTokenController = require('../controllers/refreshTokenController.js')

router.get('/', refreshTokenController)

module.exports = router