// requiring the necessary packages
const express = require("express");
const testController = require("../controllers/testController");

// creating an express router instance to handle client requests to the '/' route
const router = express.Router();

// test route
router.get("/", testController.test_server);

module.exports = router;
