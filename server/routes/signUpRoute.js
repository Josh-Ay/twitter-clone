// requiring the neccessary packages
const express = require("express");
const signUpController = require("../controllers/signUpController");

// creating an express router instance to handle client requests to the 'signup' route
const router = express.Router();

// signup route
router.post("/signup", signUpController.user_create);

module.exports = router;