const {Router} = require("express");
const Blog = require("../models/blog");
const Comment = require("../models/comments");
const multer = require("multer");
const router = Router();
const path = require("path");


const storage = multer.diskStorage({
     destination: function (req, file, cb) {
          cb(null, path.resolve(`./public/uploads/`));
    },//path.resolve gives the absolute path which is better in file upload


   filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname}`;
         cb(null, fileName)
   }
});

const upload = multer({ storage: storage });


router.get("/add-new", (req, res)=>{
    res.render("add-blog.ejs", {
        user : req.user
    }); //need user here coz we have nav bar in add-blog as well 
    // there we do show the user name so,
    //  but idk how we got user here = > i got it, we got that from authentication from there we had sent req.user
});

router.get("/my-blogs", async(req, res)=>{
    const allBlogs = await Blog.find({
        createdBy: req.user._id
    }   );
    return res.render("my-blogs.ejs", {
        user: req.user,
        all_my_Blogs : allBlogs,
    })
});

router.get("/:id", async(req, res)=>{
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    const comments = await Comment.find({ blog: req.params.id }).populate("createdBy");

    console.log(blog);
    return res.render("blog-view", {
        user : req.user,
        blog,
        comments,
    })
});

router.post("/add-new", upload.single("coverImage"), async (req, res)=>{
    console.log(req.body);
    const {title , body} = req.body;
    const blog = await Blog.create({
        title: title,
        body : body,
        coverImage: `/uploads/${req.file.filename}`,
        createdBy: req.user._id,
    });
    return res.redirect(`/blog/${blog._id}`)
});


router.post("/comment/:id", async (req, res)=>{
    console.log(req.body);
    const {content} = req.body;
    const blog = await Blog.findById(req.params.id);
    console.log(blog);
    
    const comment = await Comment.create({
        content,
        blog: blog._id,
        
        createdBy: req.user._id,
    });
    return res.redirect(`/blog/${blog._id}`);
});



module.exports = router;
