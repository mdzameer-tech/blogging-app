const { Router } = require("express");
const User = require("../models/user");

const router = Router();




router.get("/signup", (req, res)=>{
    res.render("signup.ejs");

});

router.get("/signin", (req, res)=>{
    res.render("signin.ejs");

});




// MINE WORKS BUT WANT TO TRY CATCH ERROR

// router.post("/signup", async (req, res)=>{
//     const {fullName, email, password } = req.body;
//     await User.create({
//         fullName, 
//         email, 
//         password 
//     });

//     return res.redirect("/home");
// });

router.post("/signup", async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        await User.create({ fullName, email, password });
        return res.redirect("/signin");
    } catch (err) {
        if (err.code === 11000) {
            // duplicate email
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





router.post("/signin", async (req, res)=>{
    const { password, email } = req.body;

    const user = await User.matchPassword(email, password);

    console.log("User", user);

    return res.redirect("/");
});


module.exports = router;
