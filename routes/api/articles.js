const router = require("express").Router();
const {
  getAllArticles,
  postArticle,
  updateArticle,
  deleteArticle,
  findArticleById,
  getUserArticles,
  postComment,
  searchArticle
} = require("../../controllers/articlesController.js");
const verifyJWTs = require("../../middlewares/verifyJWTs.js");

router.use(verifyJWTs);

router.get("/myarticles", getUserArticles);
router.get("/search", searchArticle)
router.post("/:id/comment", postComment)
router.get("/:id", findArticleById);

router
  .route("/")
  .get(getAllArticles)
  .post(postArticle)
  .put(updateArticle)
  .delete(deleteArticle);

module.exports = router;