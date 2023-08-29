const router = require("express").Router();
const {
  getAllUsers_private,
  getUserById,
  deleteUser,
  setMyDetails,
  getMyDetails,
  getUserArticles,
  setProfilePic,
  getProfilePic,
  removeProfilePic,
  toggleFollow
} = require("../controllers/usersController.js");
const { verifyJWTs } = require("../middlewares/verifyJWTs.js");
const profilePicUpload = require('../middlewares/profilePicUpload.js');


router.get("/getmydetails", verifyJWTs, getMyDetails);
router.patch("/editmydetails", verifyJWTs, setMyDetails);
router.post('/upload', [profilePicUpload, verifyJWTs], setProfilePic)
router.patch('/follower', verifyJWTs, toggleFollow)
router.get('/upload/:userId', verifyJWTs, getProfilePic);
router.delete('/upload', verifyJWTs, removeProfilePic);



router.get('/:id/articles', getUserArticles)
router.get("/:id", verifyJWTs, getUserById);

router.route("/").get(verifyJWTs, getAllUsers_private).delete(verifyJWTs, deleteUser);

module.exports = router;
