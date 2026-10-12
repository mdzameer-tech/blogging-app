const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const http = require("http");
const { Server } = require("socket.io");
const registerEditorSocket = require("./sockets/editor");


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
app.use(express.static(path.resolve("./public"))); // so that the browser can load/access files from public directly! without this it cant 

app.use(checkForAuthenticationCookie("token"));





app.get("/", async(req, res)=>{
    const allBlogs = await Blog.find({});
    res.render("home.ejs", {
        user: req.user,
        blogs : allBlogs,
    })
});

app.use("/user", userRouter);

app.use("/blog", blogRouter);




const server = http.createServer(app);
const io = new Server(server);
app.set("io", io);                 // so routes can reach it later
registerEditorSocket(io);

server.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));