const User = require("../model/User.js");
const Article = require("../model/article.js");
const sharp = require('sharp');
const getDataUri = require('../utils/dataUri.js')
const path = require('path')
const cloudinary = require('cloudinary')
const ObjectId = require('mongoose').Types.ObjectId;


const getAllUsers_private = async (req, res) => {
  try {
    const currUserId = req.userId;
    if (!currUserId) return res.status(401).json({ message: "Unauthorized to access users", status: 'error' });

    // fetching users from data base except the current one -> $ne = not equal
    const users = await User.find({ _id: { $ne: currUserId } }).lean().select("-password -refreshToken -email -roles");

    // const result = await User.updateMany({}, { followers: [], following: [] })

    const currUser = await User.findById(currUserId).exec();
    if (!currUser) return res.status(404).json({ message: "Requesting user doesn't exist", status: 'error' })

    const filteredUsers = users.map(user => {
      const mutualConnects = user.connections.map(connect => currUser.connections.includes(connect) && connect).filter(Boolean);

      const isFollowing = user.followers.some(followerId => followerId.equals(currUserId));

      if (user._id !== currUserId) {
        return { ...user, isFollowing, mutualConnects };
      }
    }).filter(Boolean);


    res.json(filteredUsers);
  } catch (e) {
    res.status(500).json({ message: e.message, status: 'error' })
  }
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
  try {
    const id = req.params.id;
    const currUserId = req.userId;
    if (!currUserId) return res.status(401).json({ message: "Unauthorized to access users", status: 'error' });

    const currUser = await User.findById(currUserId).exec();
    if (!currUser) return res.status(404).json({ message: "Requesting user doesn't exist", status: 'error' })

    const foundUser = await User.findById(id).lean().select("-password -refreshToken -email -roles").populate({ path: 'following', select: "-password -refreshToken -email -roles" }).exec();
    if (!foundUser) return res.status(404).json({ message: "No user found with this id", status: 'error' });

    const isFollowing = foundUser.followers.some(followerId => followerId.equals(currUserId));

    const mutualConnects = foundUser.connections.map(connect => currUser.connections.includes(connect) && connect).filter(Boolean);

    // await User.updateMany({}, { connections: [] });

    res.json({ ...foundUser, isFollowing, mutualConnects });

  } catch (e) {
    res.status(500).json({ message: e.message, status: 'error' })
  }
};

const getMyDetails = async (req, res) => {
  const reqEmail = req.email;

  if (!reqEmail)
    return res.status(401).json({
      message: "You are unauthorized to get any details",
    });

  try {
    const details = await User.findOne({ email: reqEmail })
      .select("details followers following profile connections").populate({ path: 'connections.user', select: "-password -refreshToken -email -roles" })
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

const getUserArticles = async (req, res) => {
  const limit = req?.query.limit || 0;
  const userId = req.params?.id;

  if (!userId) return res.status(400).json({ message: 'User id is required', status: 'error' })

  try {
    const articles = await Article.find({})
      .where("author")
      .equals(userId)
      .limit(limit)
      .populate({
        path: "author",
        select: "-password -refreshToken -roles",
      })
      .exec();

    if (!articles) return res.status(404).json({ message: "No articles found for the requested user", status: 'error' })

    const sortedArticles = [...articles].reverse();
    res.json(sortedArticles);
  } catch (e) {
    res.status(500).json({
      message: e.message,
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
  const width = 300;
  const height = 300;
  const quality = 80; // Set your desired quality (0 to 100)

  // Resize and compress the image using sharp
  const resizedImage = await sharp(file.buffer)
    .resize(width, height, { fit: 'cover' })
    .jpeg({ quality })
    .toBuffer();

  // setting file Uri using datauri
  const fileName = path.extname(file.originalname).toString()
  const fileUri = getDataUri(fileName, resizedImage); // any file name, buffer

  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);
  console.log(myCloud.secure_url)

  try {
    foundUser.profile.public_id = myCloud.public_id
    foundUser.profile.url = myCloud.secure_url;
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

  const image_url = foundUser.profile.url;

  res.json(image_url);
}

const removeProfilePic = async (req, res) => {
  const email = req.email;

  const foundUser = await User.findOne({ email }).exec();

  if (!foundUser) return res.status(401).json({ message: 'You are unauthorized to remove any image' })

  try {
    foundUser.profile.public_id = null
    foundUser.profile.url = null

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

const toggleFollow = async (req, res) => {
  try {
    const followedUserId = req.body.id;
    const followerId = req.userId;

    if (!followedUserId) {
      return res.status(400).json({ message: 'Followed user must be specified', status: 'error' });
    }
    if (!followerId) {
      return res.status(401).json({ message: 'Unauthorized to toggle follow status', status: 'error' });
    }

    const followedUser = await User.findById(followedUserId);
    const follower = await User.findById(followerId);

    if (!followedUser) {
      return res.status(404).json({ message: 'Requested user not found', status: 'error' });
    }
    if (!follower) {
      return res.status(404).json({ message: 'Follower not found', status: 'error' });
    }

    const followerIndex = followedUser.followers.indexOf(followerId);
    const followingIndex = follower.following.indexOf(followedUserId);

    if (followerIndex === -1 && followingIndex === -1) {
      // Neither following nor a follower, so add both
      followedUser.followers.push(followerId);
      follower.following.push(followedUserId);
    } else {
      // Either following or a follower, so remove both
      if (followerIndex !== -1) {
        followedUser.followers.splice(followerIndex, 1);
      }
      if (followingIndex !== -1) {
        follower.following.splice(followingIndex, 1);
      }
    }

    await Promise.all([followedUser.save(), follower.save()]);

    const message = followerIndex === -1 ? 'Successfully added to interests' : 'Successfully removed from interests';
    res.json({ message, status: 'success' });
  } catch (error) {
    res.status(500).json({ message: error.message, status: 'error' });
  }
}



module.exports = { getAllUsers_private, getUserById, deleteUser, getUserArticles, getMyDetails, setMyDetails, setProfilePic, getProfilePic, removeProfilePic, toggleFollow };
