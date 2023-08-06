const router = require('express').Router()
const { register, login, refresh, logout, googleOAuthLogin } = require('../controllers/authControllers.js');

router.post('/register', register);
router.post('/login', login);
router.post('/Oauth/v2', googleOAuthLogin)
router.get('/refresh', refresh);
router.post('/logout', logout);


module.exports = router