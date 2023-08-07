const User = require("../model/User");
const { OAuth2Client } = require('google-auth-library');
const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const axios = require('axios')

const oAuth2Client = new OAuth2Client(clientId, clientSecret, 'postmessage');

const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')

const register = async (req, res) => {
    const { email, pwd, fullname } = req.body;
    const pwdRegex = new RegExp(process.env.PASSWORD_REGEX);
    const emailRegex = new RegExp(process.env.EMAIL_REGEX);
    const fullnameRegex = new RegExp(process.env.FULLNAME_REGEX);

    if (!email || !pwd || !fullname)
        return res.status(400).json({
            error: true,
            message: "Full name, email and password are required",
        });

    const userExists = await User.findOne({ email }).exec();
    if (userExists)
        return res.status(409).json({
            error: true,
            message: "An account already existed with this email. Head to login",
            type: "Duplicate email",
        });

    if (!fullnameRegex.test(fullname)) {
        return res.status(400).json({
            "message": "Enter a valid full name",
            "type": "Invalid fullname"
        })
    }



    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: true,
            message: "Enter a valid email",
            type: "Invalid email",
        });
    }

    let pwdErrMsg;

    if (!pwdRegex.test(pwd)) {
        if (pwd.length < 8) {
            pwdErrMsg = "Password must be at least 8 characters long.";
        } else if (!pwd.match(/[a-z]/)) {
            pwdErrMsg = "Password must contain at least one lowercase letter.";
        } else if (!pwd.match(/[A-Z]/)) {
            pwdErrMsg = "Password must contain at least one uppercase letter.";
        } else if (!pwd.match(/\d/)) {
            pwdErrMsg = "Password must contain at least one digit.";
        } else if (!pwd.match(/[@#$%^&+=*!]/)) {
            pwdErrMsg =
                "Password must contain at least one special character (@#$%^&+=*!).";
        } else {
            //   pwdErrMsg = "");
        }
        return res.status(422).json({
            "message": "Password validation failed",
            "type": "Invalid password",
            "pwdCorrectionMsg": pwdErrMsg
        });
    }

    try {
        const newUser = await User.create({
            fullname,
            email,
            password: await bcrypt.hash(pwd, 10),
        });

        res.status(201).json({
            message: "User registered successfully",
            user: newUser,
        });
    } catch (e) {
        res.status(500).json({
            error: true,
            message: `${e.message}`,
        });
    }
};

const login = async (req, res) => {
    const { email, pwd } = req.body

    if (!email || !pwd) return res.status(400).json({
        "error": true,
        "message": 'Both email and password are required'
    })

    // finding the user from the mongodb database
    const foundUser = await User.findOne({ email }).exec()
    if (!foundUser) {
        // return res.sendStatus(401) // unauthorized
        return res.status(401).json({ message: `Invalid Email` }) // unauthorized
    }

    const userId = foundUser._id;
    console.log(userId)
    // evaluating the password
    const isPwdMatch = await bcrypt.compare(pwd, foundUser.password)

    const roles = Object.values(foundUser.roles).filter(Boolean)

    const fullname = foundUser.fullname;

    // if password matches
    if (isPwdMatch) {
        const accessToken = jwt.sign(
            { userInfo: { email, roles, fullname, userId } },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        )

        const refreshToken = jwt.sign(
            { email, roles, fullname, userId },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '3d' }
        )
        let doc = await User.findOneAndUpdate({ email }, { refreshToken }, { new: true }).exec()

        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 3600 * 1000, sameSite: 'None', secure: true })
        res.json({ accessToken })
    } else {
        res.status(401).json({
            error: true,
            message: 'Incorrect password'
        })
    }
}

const refresh = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) return res.sendStatus(403); //Forbidden
    // evaluate jwt
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err || foundUser.email !== decoded.email) return res.sendStatus(403);

        const accessToken = jwt.sign(
            {
                userInfo: {
                    email: decoded.email,
                    roles: decoded.roles,
                    fullname: decoded.fullname,
                    userId: decoded.userId,
                },
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );
        res.json({
            accessToken,
        });
    });
};

const logout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204) // no content
    const refreshToken = cookies.jwt;

    const foundUser = await User.findOne({ refreshToken }).exec()
    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None' })
        return res.sendStatus(204);
    }

    const doc = User.findOneAndUpdate({ email: foundUser.email }, { refreshToken: '' }).exec();

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: 'true' })
    res.sendStatus(204)
}


// verify the google id on server side: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

const googleOAuthLogin = async (req, res) => {
    const { code } = req.body;

    if (!code) return res.status(400).json({ message: 'Argument missing' });

    try {
        const { tokens } = await oAuth2Client.getToken(code); // exchange code for tokens
        const access_token = tokens?.access_token
        let user = {};

        // fetching the user info
        if (access_token) {
            try {
                const response = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`, {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        Accept: 'application/json'
                    }
                })

                user = response.data;
            } catch (e) {
                res.json({
                    message: e.message,
                    status: 'error'
                })
            }
        }

        const { email, verified_email, name, picture } = user;

        if (!verified_email) return res.status(401).json({ message: 'email address is not verified' })

        const foundUser = await User.findOne({ email });

        // if the user is new, create the user in database
        if (!foundUser) {
            // create new user
            const newUser = await User.create({
                fullname: name,
                email,
                password: null,
            })


            const { fullname, _id: userId } = newUser;

            const roles = Object.values(newUser.roles).filter(Boolean)

            const accessToken = jwt.sign(
                { userInfo: { email, roles, fullname, userId } },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            )

            const refreshToken = jwt.sign(
                { email, roles, fullname, userId },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '3d' }
            )
            let doc = await User.findOneAndUpdate({ email }, { refreshToken }, { new: true }).exec()

            res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 3600 * 1000, sameSite: 'None', secure: true })
            res.json({ accessToken })
            return;

        }

        // if the user already exists directly login the user
        const { fullname, _id: userId } = foundUser;

        const roles = Object.values(foundUser.roles).filter(Boolean)

        const accessToken = jwt.sign(
            { userInfo: { email, roles, fullname, userId } },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        )

        const refreshToken = jwt.sign(
            { email, roles, fullname, userId },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '3d' }
        )
        let doc = await User.findOneAndUpdate({ email }, { refreshToken }, { new: true }).exec()

        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 3600 * 1000, sameSite: 'None', secure: true })
        res.json({ accessToken })

    } catch (e) {
        res.status(500).json({
            message: e.message,
            status: 'error',
        })
    }
}

module.exports = { register, login, refresh, logout, googleOAuthLogin };
