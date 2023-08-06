const User = require("../model/User.js");
const sharp = require('sharp');


const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");

  if (!users || !users.length)
    return res.json({ message: "No users registered" });

  res.json(users);
};

const deleteUser = async (req, res) => {
  const { id } = req.body;

  if (!id)
    return res.status(400).json({
      message: "id of the user must be sent",
    });

  const foundUser = await User.findById(id).exec();

  if (!foundUser)
    return res.status(400).json({
      message: `Can't perform delete operation, no user found`,
    });

  await User.deleteOne({ _id: id });

  res.sendStatus(204);
};

const getUserById = async (req, res) => {
  const id = req.params.id;

  const foundUser = await User.findById(id).exec();

  if (!foundUser)
    return res.status(404).json({
      message: "No user found with this id",
    });

  res.json(foundUser);
};

const getMyDetails = async (req, res) => {
  const reqEmail = req.email;

  if (!reqEmail)
    return res.status(401).json({
      message: "You are unauthorized to get any details",
    });

  try {
    const details = await User.findOne({ email: reqEmail })
      .select("details followers following profile")
      .exec();

    if (!details) return res.sendStatus(403);

    res.json(details);
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

const setMyDetails = async (req, res) => {
  const userEmail = req.email;

  const { profession, address, description, socialLinks, writesOn } =
    req.body;

  if (!req.body)
    return res.status(403).json({
      message: "Missing arguments",
    });

  try {
    const foundUser = await User.findOne({ email: userEmail })
      .select("-password -roles -refreshToken")
      .exec();

    if (!foundUser) return res.sendStatus(403);

    const writesOnArr = writesOn?.length ? writesOn.slice(0, 5) : []

    foundUser.details = {
      profession,
      address,
      description,
      socialLinks,
      writesOn: writesOnArr,
    };

    await foundUser.save();

    res.json({
      message: 'Profile updated successfully',
      status: 200,
    })
  } catch (e) {
    res.status(500).json({
      message: e.message,
      status: 500
    });
  }
};

const setProfilePic = async (req, res) => {
  const file = req.file;
  // console.log(req.body)
  if (!file) return res.status(400).json({ message: 'No files served' });

  const userEmail = req.email;
  const foundUser = await User.findOne({ email: userEmail }).exec();
  if (!foundUser) return res.status(401).json({ message: 'Unauthorized' })

  // Set the desired image dimensions and quality
  const width = 200;
  const height = 200;
  const quality = 80; // Set your desired quality (0 to 100)

  // Resize and compress the image using sharp
  const resizedImage = await sharp(file.buffer)
    .resize(width, height, { fit: 'cover' })
    .jpeg({ quality })
    .toBuffer();

  try {
    foundUser.profile.name = file.originalname
    foundUser.profile.data = resizedImage
    foundUser.profile.type = file.mimetype
    await foundUser.save();

    res.json({ message: 'Profile picture added', status: 200 })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

const getProfilePic = async (req, res) => {
  const userId = req.params.userId;


  const foundUser = await User.findById(userId).exec();
  // console.log(foundUser)

  if (!foundUser) return res.status(401).json({ message: 'Unauthorized to get profile picture' });

  const pp = foundUser.profile;

  res.json(pp);
}

const removeProfilePic = async (req, res) => {
  const email = req.email;

  const foundUser = await User.findOne({ email }).exec();

  if (!foundUser) return res.status(401).json({ message: 'You are unauthorized to remove any image' })

  try {
    foundUser.profile.name = 'Profile'
    foundUser.profile.data = null
    foundUser.profile.type = ''

    await foundUser.save();
    res.json({ message: 'Removed Successfully', status: 200 })
  } catch (e) {
    console.log(e)
    res.status(500).json({
      message: e.message,
      status: 500,
    })
  }
}

module.exports = { getAllUsers, getUserById, deleteUser, getMyDetails, setMyDetails, setProfilePic, getProfilePic, removeProfilePic };
