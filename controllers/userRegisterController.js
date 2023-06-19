const User = require('../model/User')

const bcrypt = require('bcrypt')

const registerUser = async (req, res) => {
    const {email, pwd, fullname} = req.body

    if (!email || !pwd || !fullname) return res.status(400).json({
        "error": true,
        "message": 'Full name, email and password are required'
    })

    const userExists = await User.findOne({email}).exec();
    if (userExists) return res.status(409).json({
        "error": true,
        "message": 'An account already existed with this email. Head to login'
    })

    try{
        const newUser = await User.create({
            fullname,
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