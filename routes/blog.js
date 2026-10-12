const {Router} = require("express");
const Blog = require("../models/blog");
const Comment = require("../models/comments");
const User = require("../models/user");
const BlogVersion = require("../models/blogVersion");
const multer = require("multer");
const router = Router();
const path = require("path");

function requireLogin(req, res, next) {
  if (!req.user) return res.redirect("/user/signin");
  next();
}

function canEdit(blog, uid) {
  return (
    String(blog.createdBy) === uid ||
    blog.collaborators.some((c) => String(c) === uid)
  );
}


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

// Editor page
router.get("/:id/edit", requireLogin, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).send("Blog not found");
  if (!canEdit(blog, req.user._id)) return res.status(403).send("Forbidden");

  const versions = await BlogVersion.find({ blogId: blog._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("savedBy");

  return res.render("edit", { user: req.user, blog, versions });
});

// Owner adds a collaborator by email
router.post("/:id/collaborators", requireLogin, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog || String(blog.createdBy) !== req.user._id)
    return res.status(403).send("Only the author can add collaborators");

  const collaborator = await User.findOne({ email: req.body.email });
  if (!collaborator) return res.status(404).send("No user with that email");

  await Blog.findByIdAndUpdate(blog._id, {
    $addToSet: { collaborators: collaborator._id },
  });
  return res.redirect(`/blog/${blog._id}`);
});

// Restore an older version
router.post("/:id/versions/:versionId/restore", requireLogin, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog || !canEdit(blog, req.user._id)) return res.status(403).send("Forbidden");

  const version = await BlogVersion.findOne({ _id: req.params.versionId, blogId: blog._id });
  if (!version) return res.status(404).send("Version not found");

  await Blog.findByIdAndUpdate(blog._id, { body: version.body });
  req.app.get("io").to(String(blog._id)).emit("init", { body: version.body }); // update live editors
  return res.redirect(`/blog/${blog._id}/edit`);
});

router.get("/:id", async(req, res)=>{
    const blog = await Blog.findById(req.params.id).populate("createdBy").populate("collaborators");
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
