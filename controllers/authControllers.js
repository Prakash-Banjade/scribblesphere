const User = require("../model/User");
const { OAuth2Client } = require('google-auth-library');
const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const axios = require('axios')
const { v4: uuid } = require('uuid')
const send_mail = require('../utils/Mail.js')
const generateOtpAndSave = require('../utils/generateOtpAndSave.js')

const oAuth2Client = new OAuth2Client(clientId, clientSecret, 'postmessage');
const client = new OAuth2Client();

const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')

const generateOtp = async (req, res) => {
    const { email, fullname, pwd } = req.body; // email, fullname and password are validated by the middleware

    try {
        const OTP = await generateOtpAndSave(email, fullname, pwd);
        send_mail(fullname, email, OTP);
        res.json({
            message: `An OTP has been sent to ${email}. Use OTP below to continue the registration.`,
            status: 'success',
        })
    } catch (e) {
        res.status(500).json({ message: e.message, status: 'error' })
    }
};

const register = async (req, res) => {
    const { fullname, email, pwd } = req; // these values are fetched and set from database and by verifyOTP middleware;
    try {
        const newUser = await User.create({
            fullname,
            email,
            password: await bcrypt.hash(pwd, 10),
        });

        res.status(201).json({
            message: "User registered successfully",
            status: 'success',
        });
    } catch (e) {
        res.status(500).json({
            error: true,
            message: `${e.message}`,
        });
    }
}

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
    const { code, credential } = req.body;

    if (!code && !credential) return res.status(400).json({ message: 'Argument missing' });

    try {
        let user = {};

        // in case for Google OAuth 2.0 authentication flow i.e while using useGoogleLogin() on client
        if (code) {
            const { tokens } = await oAuth2Client.getToken(code); // exchange code for tokens
            const access_token = tokens?.access_token

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
        }

        // in case for use of google one tap api i.e. while using useGoogleOneTapLogin() on client
        if (credential) {
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: clientId,
            });
            const payload = ticket.getPayload();
            user = payload;
        }

        const { email, name, picture } = user;
        console.log(picture)

        // if (!verified_email) return res.status(401).json({ message: 'email address is not verified', user: user })

        const foundUser = await User.findOne({ email });

        // if the user is new, create the user in database
        if (!foundUser) {
            // create new user
            const newUser = await User.create({
                fullname: name,
                email,
                password: null,
                profile: {
                    public_id: uuid(),
                    url: picture,
                }
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

module.exports = { register, generateOtp, login, refresh, logout, googleOAuthLogin };
