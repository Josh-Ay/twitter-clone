// requiring the necessary packages
const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");

// creating an express router instance to handle client requests to the 'auth' route
const router = express.Router();

// get user data when user has been authenticated/logged-in or not
router.get("/login/success", authController.get_user_details);
router.get("/login/failed", authController.get_failed_response);

// google authentication routes
router.get("/google", passport.authenticate("google", {scope: ["profile", "email"]}));
router.get("/google/success", passport.authenticate("google", {
    successRedirect: process.env.CLIENT_URL,
    failureRedirect: "/login/failed"
}));

// github authentication routes
router.get("/github", passport.authenticate("github", {scope: ["user:email"]}));
router.get("/github/success", passport.authenticate("github", {
    successRedirect: process.env.CLIENT_URL,
    failureRedirect: "/login/failed"
}));

// facebook authentication routes
router.get("/facebook", passport.authenticate("facebook", {scope: ["email"]}));
router.get("/facebook/success", passport.authenticate("facebook", {
    successRedirect: process.env.CLIENT_URL,
    failureRedirect: "/login/failed"
}));

module.exports = router;
