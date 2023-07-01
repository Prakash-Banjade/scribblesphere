const User = require('../model/User')

const handleLogout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204) // no content
    const refreshToken = cookies.jwt;

    const foundUser = await User.findOne({refreshToken}).exec()
    if (!foundUser) {
        res.clearCookie('jwt', {httpOnly: true, sameSite: 'None'})
        return res.sendStatus(204);
    }

    const doc = User.findOneAndUpdate({email: foundUser.email}, {refreshToken: ''}).exec();

    req.user = null;
    req.email = null;
    req.roles = null;

    res.clearCookie('jwt', {httpOnly: true, sameSite: 'None', secure: 'true'})
    res.sendStatus(204)
}

module.exports = handleLogout