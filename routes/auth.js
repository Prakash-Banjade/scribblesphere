const router = require('express').Router()
const { register, generateOtp, login, refresh, logout, googleOAuthLogin } = require('../controllers/authControllers.js');
const credentialValidate = require('../middlewares/credentialValidate.jsx');
const verifyOtp = require('../middlewares/verifyOtp.js');

router.post('/register', verifyOtp, register); // verify the otp before registeting the user
router.post('/generateOtp', credentialValidate, generateOtp); // validate the users entered details before generating the otp
router.post('/login', login);
router.post('/Oauth/v2', googleOAuthLogin)
router.get('/refresh', refresh);
router.post('/logout', logout);


module.exports = router