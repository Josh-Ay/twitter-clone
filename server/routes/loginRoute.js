// requiring the necessary packages
const express = require("express");
const loginController = require("../controllers/loginController");

// creating an express router instance to handle client requests to the 'login' route
const router = express.Router();

// login route
router.post("/login", loginController.login_user);

module.exports = router;
