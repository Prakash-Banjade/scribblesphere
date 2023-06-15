const router = require("express").Router();
const {
  getAllArticles,
  postArticle,
  updateArticle,
  deleteArticle,
  findArticleById,
} = require("../controllers/articlesController.js");
const verifyJWTs = require("../middlewares/verifyJWTs.js");

router.use(verifyJWTs);
router.route("/")
  .get(getAllArticles)
  .post(postArticle)
  .put(updateArticle)
  .delete(deleteArticle);

router.get('/:id', findArticleById);

module.exports = router;
