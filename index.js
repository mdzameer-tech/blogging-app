const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');


const { checkForAuthenticationCookie } = require("./middlewares/authentication");
const userRouter = require("./routes/user");
const blogRouter = require("./routes/blog");

const Blog = require("./models/blog");

const app = express();
const PORT = 10000;



app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

mongoose.connect("mongodb://localhost:27017/blogify")
    .then(()=>{console.log("mongodb connected")})
    .catch((err)=>{ console.log(err, "error occured in mongodb connection")});



app.use(express.urlencoded({extended : false}));
app.use(cookieParser());
app.use(express.static('public')); // so that the browser can load/access files from public directly! without this it cant 

app.use(checkForAuthenticationCookie("token"));





app.get("/", async(req, res)=>{
    const allBlogs = await (await Blog.find({}));
    res.render("home.ejs", {
        user: req.user,
        blogs : allBlogs,
    })
});

app.use("/user", userRouter);

app.use("/blog", blogRouter);




app.listen(PORT, ()=>{
    console.log("server started listening at", PORT);
} );