const router = require('express').Router()
const { register, login, refresh, logout } = require('../controllers/authControllers.js');

router.post('/register', register);
router.post('/login', login);
router.get('/refresh', refresh);
router.post('/logout', logout);


module.exports = router