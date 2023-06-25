const User = require("../model/User.js");

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
      .select("details")
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

  const { nickname, qualification, address, brith, socialLinks, writesOn } =
    req.body.details;

  if (!req.body.details)
    return res.status(403).json({
      message: "update details must be passed in the request body",
    });

  try {
    const foundUser = await User.findOne({ email: userEmail })
      .select("-password")
      .exec();

    if (!foundUser) return res.sendStatus(403);

    foundUser.details = {
      nickname,
      qualification,
      address,
      brith,
      socialLinks,
      writesOn,
    };

    await foundUser.save();

    res.json({
      message: 'Details updated successfully'
    })
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

module.exports = { getAllUsers, getUserById, deleteUser, getMyDetails, setMyDetails };
