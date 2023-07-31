const User = require("../model/User");

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

    // evaluating the password
    const isPwdMatch = await bcrypt.compare(pwd, foundUser.password)

    const roles = Object.values(foundUser.roles).filter(Boolean)

    const fullname = foundUser.fullname;

    // if password matches
    if (isPwdMatch) {
        const accessToken = jwt.sign(
            { userInfo: { email, roles, fullname } },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        )

        const refreshToken = jwt.sign(
            { email, roles, fullname },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '3d' }
        )
        let doc = await User.findOneAndUpdate({ email }, { refreshToken }, { new: true }).exec()
        console.log(doc);

        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 3600 * 1000, })
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
    console.log(foundUser)
    if (!foundUser) return res.sendStatus(403); //Forbidden
    const roles = Object.values(foundUser.roles);
    // evaluate jwt
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err || foundUser.email !== decoded.email) return res.sendStatus(403);

       console.log(decoded)
        const accessToken = jwt.sign(
            {
                userInfo: {
                    email: decoded.email,
                    roles: decoded.roles,
                    fullname: decoded.fullname,
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

module.exports = { register, login, refresh, logout };
