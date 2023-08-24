const router = require("express").Router();
const {
  getAllUsers,
  getUserById,
  deleteUser,
  setMyDetails,
  getMyDetails,
  getUserArticles,
  setProfilePic,
  getProfilePic,
  removeProfilePic
} = require("../controllers/usersController.js");
const verifyJWTs = require("../middlewares/verifyJWTs.js");
const profilePicUpload = require('../middlewares/profilePicUpload.js');


router.get("/getmydetails", verifyJWTs, getMyDetails);
router.patch("/editmydetails", verifyJWTs, setMyDetails);
router.post('/upload', [profilePicUpload, verifyJWTs], setProfilePic) // attatch verifyJWTs middleware
router.get('/upload/:userId', verifyJWTs, getProfilePic);
router.delete('/upload', verifyJWTs, removeProfilePic);
router.get('/:id/articles', getUserArticles)
router.get("/:id", getUserById);

router.route("/").get(getAllUsers).delete(verifyJWTs, deleteUser); // attatch verifyJWTs middleware in delete route

module.exports = router;
