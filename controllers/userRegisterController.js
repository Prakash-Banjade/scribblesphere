const User = require('../model/User')

const bcrypt = require('bcrypt')

const registerUser = async (req, res) => {
    const {username, pwd} = req.body

    if (!username || !pwd) return res.status(400).json({
        "error": true,
        "message": 'Both username and pwd must not be empty'
    })

    const userExists = await User.findOne({username}).exec();
    if (userExists) return res.status(409).json({
        "error": true,
        "message": 'User already exists. Try a different username'
    })

    try{
        const newUser = await User.create({
            username,
            password: await bcrypt.hash(pwd, 10) 
        })

        res.status(201).json({
            message: 'User registered successfully'
        })

    }catch(e){
        res.status(500).json({
            "error": true,
            "message": `${e.message}`
        })
    }
}

module.exports = registerUser