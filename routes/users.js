const router = require("express").Router();
const {
  getAllUsers,
  getUserById,
  deleteUser,
  setMyDetails,
  getMyDetails,
} = require("../controllers/usersController.js");
const verifyJWTs = require("../middlewares/verifyJWTs.js");

router.use(verifyJWTs);
router.get("/getmydetails", getMyDetails);
router.patch("/editmydetails", setMyDetails);
router.get("/:id", getUserById);

router.route("/").get(getAllUsers).delete(deleteUser);

module.exports = router;
