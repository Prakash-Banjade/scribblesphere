const router = require("express").Router();
const { searchArticle } = require("../../controllers/searchArticleController");

router.get("/api/articles/search", searchArticle);

module.exports = router;
