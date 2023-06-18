const User = require('../model/User')

const bcrypt = require('bcrypt')

const registerUser = async (req, res) => {
    const {email, pwd, username} = req.body

    if (!email || !pwd || !username) return res.status(400).json({
        "error": true,
        "message": 'Username, email and password are required'
    })

    const userExists = await User.findOne({email}).exec();
    if (userExists) return res.status(409).json({
        "error": true,
        "message": 'An account already existed with this email. Head to login'
    })

    try{
        const newUser = await User.create({
            username,
            email,
            password: await bcrypt.hash(pwd, 10) 
        })

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser
        })

    }catch(e){
        res.status(500).json({
            "error": true,
            "message": `${e.message}`
        })
    }
}

module.exports = registerUser