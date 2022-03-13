// requiring the necessary packages
const express = require("express");
const logoutController = require("../controllers/logoutController");

// creating an express router instance to handle client requests to the 'logout' route
const router = express.Router();

// logout route
router.get("/logout", logoutController.logout_user);

module.exports = router;
