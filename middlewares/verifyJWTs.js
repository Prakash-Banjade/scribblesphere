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

            req.user = decoded.userInfo.username; 
            req.roles = decoded.userInfo.roles
            next();
        }
    )
}

module.exports = verifyJWTs