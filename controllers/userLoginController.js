const User = require('../model/User')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const loginUser = async (req, res) => {
    const {email, pwd} = req.body

    if (!email || !pwd) return res.status(400).json({
        "error": true,
        "message": 'Both email and password are required'
    })

    // finding the user from the mongodb database
    const foundUser = await User.findOne({email}).exec()
    if (!foundUser) {
        // return res.sendStatus(401) // unauthorized
        return res.status(401).json({message: `Invalid Email`}) // unauthorized
    }

    // evaluating the password
    const isPwdMatch = await bcrypt.compare(pwd, foundUser.password)

    const roles = Object.values(foundUser.roles).filter(Boolean)

    // if password matches
    if (isPwdMatch) {
        const accessToken = jwt.sign(
            {userInfo: { email, roles }}, // this first parameter is the payload of the user that is the data of user that the jwt token contains. We pass the keys of the roles not the word 'Admin', 'user' itself.
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: '300s'}
        )

        const refreshToken = jwt.sign(
            {email},
            process.env.REFRESH_TOKEN_SECRET,
            {expiresIn: '1d'}
        )

        // Updating the user to save the refresh token in db
        // model.findOneAndUpdate() finds the first document that matches a given filter, applies an update, and returns the document: syntax -> model.findOneAndUpdate(filter, update)
        let doc = await User.findOneAndUpdate({email}, {refreshToken}, {new: true}).exec()

        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24*3600*1000})
        res.json({accessToken, roles})
    }else{
        res.status(401).json({
            error: true,
            message: 'Incorrect password'
        })
    }  
}

module.exports = loginUser