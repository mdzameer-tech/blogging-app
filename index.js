const express = require("express");
const path = require("path");
const userRouter = require("./routes/user");
const mongoose = require("mongoose");
const { checkForAuthenticationCookie } = require("./middlewares/authentication");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 10000;

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

mongoose.connect("mongodb://localhost:27017/blogify")
    .then(()=>{console.log("mongodb connected")})
    .catch((err)=>{ console.log(err, "error occured in mongodb connection")});

app.use(express.urlencoded({extended : false}));
app.use(cookieParser());

app.use(checkForAuthenticationCookie("token"));

app.get("/", (req, res)=>{
    res.render("home.ejs", {
        user: req.user,
    })
});

app.use("/user", userRouter);





app.listen(PORT, ()=>{
    console.log("server started listening at", PORT);
} );