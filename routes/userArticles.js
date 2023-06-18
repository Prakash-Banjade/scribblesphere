const router = require('express').Router();
const articlesController = require('../controllers/getUserArticles.js')
const verifyJWTs = require('../middlewares/verifyJWTs.js')

router.use(verifyJWTs)
router.get('/', articlesController)

module.exports = router;