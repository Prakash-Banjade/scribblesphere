const User = require('../model/User')

const bcrypt = require('bcrypt')

const registerUser = async (req, res) => {
    const {email, pwd} = req.body

    if (!email || !pwd) return res.status(400).json({
        "error": true,
        "message": 'Both email and pwd must not be empty'
    })

    const userExists = await User.findOne({email}).exec();
    if (userExists) return res.status(409).json({
        "error": true,
        "message": 'An account already existed with this email. Head to login'
    })

    try{
        const newUser = await User.create({
            email,
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