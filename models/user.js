const { Schema, model} = require("mongoose");

const { createHmac, randomBytes, hash } = require("crypto")

const userSchema = new Schema({
    fullName : {
        type : String,
        required : true,
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    salt : {
        type : String,
    },
    password : {
        type : String,
        required : true,
    },    
    profileImage:{
        type : String,
        default : "imdd"
    },
    role : {
        type : String,
        enum : ["USER", "ADMIN"],
        default : "USER",
    },
},
{  timestamps : true }
);

userSchema.pre("save", function (next){

    const user = this;
    if( !user.isModified("password")) return;   //imp

    const salt = randomBytes(16).toString();
    const hashedPassword = crypto
        .createHmac("sha256", salt)
        .update(user.password)
        .digest("hex");

    user.salt = salt;
    user.password = hashedPassword;

    next();
})


userSchema.static

const User = model("user", userSchema);

module.exports = User;