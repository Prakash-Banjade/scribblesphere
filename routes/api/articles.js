const router = require("express").Router();
const {
  getAllArticles,
  postArticle,
  updateArticle,
  deleteArticle,
  findArticleById,
  postComment,
  searchArticle
} = require("../../controllers/articlesController.js");
const verifyJWTs = require("../../middlewares/verifyJWTs.js");

router.use(verifyJWTs);

router.get("/search", searchArticle)
router.post("/:id/comment", postComment)
router.get("/:id", findArticleById);

router
  .route("/")
  .get(getAllArticles)
  .post(postArticle)
  .patch(updateArticle)
  .delete(deleteArticle);

module.exports = router;
