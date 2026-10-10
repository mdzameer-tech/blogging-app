const jwt = require("jsonwebtoken");

const SECRETKEY = "$gottado_it"

function createTokenForUser(user){
    const payload = {
        _id: user._id,
        email: user.email,
        firstName : user.firstName,
        profileImage: user.profileImage,
        role: user.role,
    };
    const token = jwt.sign(payload, SECRETKEY);

    return token;

}


function validateToken(token){
    const payload = jwt.verify(token, SECRETKEY);
    return payload;
}

module.exports = {
    createTokenForUser,
    validateToken,
};
