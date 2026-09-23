const express = require("express");
const path = require("path");

const app = express();
const PORT = 10000;

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.urlencoded({extended : false}));

app.get("/", (re1, res)=>{
    res.render("home.ejs")
});

app.listen(PORT, ()=>{
    console.log("server started listening at", PORT);
} );