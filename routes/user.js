const { Router } = require("express");
const path = require("path");
const multer = require("multer");
const User = require("../models/user");
const { createTokenForUser } = require("../services/authentication");

const router = Router();

function requireLogin(req, res, next) {
    if (!req.user) return res.redirect("/user/signin");
    next();
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve("./public/uploads/"));
    },
    filename: function (req, file, cb) {
        const fileName = `profile-${Date.now()}-${file.originalname}`;
        cb(null, fileName);
    },
});

const upload = multer({ storage: storage });

router.get("/signup", (req, res) => {
    res.render("signup.ejs");
});

router.get("/signin", (req, res) => {
    res.render("signin.ejs");
});

router.get("/logout", (req, res) => {
    console.log("logged out", req.user);
    res.clearCookie("token").redirect("/");
});

router.post("/signup", async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        await User.create({ firstName, lastName, email, password });
        return res.redirect("/user/signin");
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).render("signup.ejs", {
                error: "An account with this email already exists."
            });
        }
        console.error(err);
        return res.status(500).render("signup.ejs", {
            error: "Something went wrong. Please try again."
        });
    }
});

router.post("/signin", async (req, res) => {
    const { password, email } = req.body;
    try {
        const token = await User.matchPasswordAndGenerateToken(email, password);
        console.log("Token", token);
        return res.cookie("token", token).redirect("/");
    } catch (error) {
        return res.render("signin", {
            error: "incorrect email or password",
        });
    }
});

// View profile
router.get("/profile", requireLogin, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.redirect("/user/signin");
        return res.render("profile.ejs", { user });
    } catch (err) {
        console.error(err);
        return res.redirect("/");
    }
});

// Update profile image
router.post("/profile-image", requireLogin, upload.single("profileImage"), async (req, res) => {
    try {
        if (!req.file) {
            return res.redirect("/user/profile");
        }
        const profileImageUrl = `/uploads/${req.file.filename}`;
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { profileImage: profileImageUrl },
            { new: true }
        );

        // Re-generate JWT token so changes reflect instantly in req.user across pages
        const newToken = createTokenForUser(updatedUser);
        res.cookie("token", newToken);

        return res.render("profile.ejs", {
            user: updatedUser,
            success: "Profile picture updated successfully!"
        });
    } catch (err) {
        console.error("Error updating profile image:", err);
        return res.redirect("/user/profile");
    }
});

// Update personal details
router.post("/profile", requireLogin, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { firstName, lastName },
            { new: true }
        );

        // Re-generate JWT token so new firstName reflects in navbar
        const newToken = createTokenForUser(updatedUser);
        res.cookie("token", newToken);

        return res.render("profile.ejs", {
            user: updatedUser,
            success: "Personal details updated successfully!"
        });
    } catch (err) {
        console.error("Error updating profile details:", err);
        return res.redirect("/user/profile");
    }
});

module.exports = router;
