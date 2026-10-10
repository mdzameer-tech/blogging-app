const {Schema, model} = require("mongoose");
const User = require("./user");



const commentSchema = new Schema({
    content :{
        type : String,
        required: true,
    },
    createdBy :{
        type : Schema.Types.ObjectId,
        ref: "user",
    },
    blog :{
       type : Schema.Types.ObjectId,
        ref: "blog",
    },
},{
    timestamps: true
})


const Comment = model("comment", commentSchema);
module.exports = Comment;