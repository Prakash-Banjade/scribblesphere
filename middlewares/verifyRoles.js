const verifyRoles = (...allowedRoles)=>{
    return (req, res, next) => {
        // checking if there is role mentioned in request as set in verifyJWTs.js
        if(!req.roles) return res.sendStatus(401)
        const rolesToAccess = [...allowedRoles];

        // checking if allowed
        let match = false;
        rolesToAccess.forEach(role => {
            if (req.roles.includes(role)) match = true;
        })

        if (!match) return res.sendStatus(401);

        next();
    }
}

module.exports = verifyRoles;