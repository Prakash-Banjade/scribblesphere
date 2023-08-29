const jwt = require('jsonwebtoken')

const verifyJWTs = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401)

    const token = authHeader.split(' ')[1]

    // jwts verification
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) return res.sendStatus(403) // forbidden - invalid token || doesn't received token

            req.email = decoded.userInfo.email;
            req.roles = decoded.userInfo.roles;
            req.userId = decoded.userInfo.userId;
            req.user = decoded.userInfo.fullname;

            // console.log(req.email)
            next();
        }
    )
}

const verifySocketJWTs = (socket, next) => {
    const token = socket.handshake.auth.token;

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) next(new Error(`Forbidden as token doesn't match`)) // forbidden - invalid token || doesn't received token
            else {

                socket.userId = decoded.userInfo.userId;
                socket.fullname = decoded.userInfo.fullname;

                next();
            }
        }
    )
}

module.exports = { verifyJWTs, verifySocketJWTs }


