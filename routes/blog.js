const {Router} = require("express");
const Blog = require("../models/blog");
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



router.post("/add-new", upload.single("coverImage"), async (req, res)=>{
    const {title , content} = req.body;
 
    console.log(req.body);

    const blog = await Blog.create({
        title: title,
        body : content,
        coverImage: `/uploads/${req.file.filename}`,
    });
    return res.redirect(`/blog/${blog._id}`)
});



module.exports = router;