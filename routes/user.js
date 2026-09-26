const { Router } = require("express");
const User = require("../models/user");

const router = Router();




router.get("/signup", (req, res)=>{
    res.render("signup.ejs");

});

router.get("/signin", (req, res)=>{
    res.render("signin.ejs");

});


router.get("/logout",(req, res)=>{
    console.log("logged out", user)

    res.clearCookie("token").redirect("/");
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
    const { firstName, lastName, email, password } = req.body;

    try {
        await User.create({ firstName, lastName, email, password });
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
    try{
        const token  = await User.matchPasswordAndGenerateToken(email, password);

        console.log("Token", token);

        return res.cookie("token", token).redirect("/");
    }
    
    // catch(error){
    //     console.error("Sign-in failed:", error.message);
    //     // Redirect after a failed POST so refreshing the page does not resubmit it.
    //     return res.redirect("/user/signin");
    // }
    catch(error){
        return res.render("signin", {
            error: "incorrect email or password",
        })
    }
    
});


module.exports = router;
