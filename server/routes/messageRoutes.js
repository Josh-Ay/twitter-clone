// requiring the necessary packages
const express = require("express");
const multerUpload = require("../middleware/upload/multerUpload")
const messagesController = require("../controllers/messagesController");

// creating an express router instance to handle client requests to the 'message' route
const router = express.Router();

// message routes
router.get("/messages/:userId", messagesController.get_user_messages);
router.post("/messages/:senderUserId/:receiverUserId", multerUpload.single("messageImage"), messagesController.post_new_message);
router.post("/messages/:senderUserId/:receiverUserId/update_read", messagesController.mark_all_messages_read);

module.exports = router;