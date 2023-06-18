const router = require("express").Router();
const {
  getAllArticles,
  postArticle,
  updateArticle,
  deleteArticle,
  findArticleById,
  getUserArticles,
} = require("../controllers/articlesController.js");
const verifyJWTs = require("../middlewares/verifyJWTs.js");

router.use(verifyJWTs);
router
  .route("/")
  .get(getAllArticles)
  .post(postArticle)
  .put(updateArticle)
  .delete(deleteArticle);

router.get("/myarticles", getUserArticles);
router.get("/:id", findArticleById);

module.exports = router;
