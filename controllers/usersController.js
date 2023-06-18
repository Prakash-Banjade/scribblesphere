const User = require('../model/User.js')

const getAllUsers = async (req, res) => {
    const users = await User.find()

    if (!users || !users.length) return res.json({message: 'No users registered'})

    res.json(users)
}


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
}

const getUserById = async (req, res) => {
    const id = req.params.id

    const foundUser = await User.findById(id).exec();

    if (!foundUser) return res.status(404).json({
        message: 'No user found with this id'
    })

    res.json(foundUser)
}

module.exports = {getAllUsers, getUserById, deleteUser}