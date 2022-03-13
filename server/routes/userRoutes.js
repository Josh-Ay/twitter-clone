// requiring the necessary packages
const express = require("express");
const userController = require("../controllers/userController");
const userTweetController = require("../controllers/userTweetController");
const multerUpload = require("../middleware/upload/multerUpload");

// creating an express router instance to handle client requests to the 'user' route
const router = express.Router();

// user routes
router.get("/users", userController.user_index);
router.get("/usernames", userController.username_index);
router.patch("/users/:id", userController.user_update_detail);
router.patch("/users/:id/photo/upload", multerUpload.single("image"), userController.user_update_display_photo);
router.get("/users/:id/user-suggestions", userController.get_user_follower_suggestions);
router.get("/users/media/:key", userController.get_media_file);
router.post("/users/:id/follow/:requestedUserId", userController.user_follow_user);
router.get("/users/:id/tweet/", userTweetController.user_get_follow_tweet);
router.get("/users/:id/followers", userController.get_user_followers);
router.get("/users/:id/following", userController.get_user_following);
router.post("/users/:id/tweet/", multerUpload.single("imageFile"), userTweetController.user_create_tweet_post);
router.get("/users/tweet/s/explore/:q", userTweetController.tweet_search_index);
router.get("/users/:id/u/tweet/t/trends", userTweetController.get_tweet_trends);
router.get("/users/:id/u/tweet/t/trends/:trend", userTweetController.get_tweet_trend);
router.get("/users/:id/tweet/:type", userTweetController.get_user_tweet_index);
router.get("/users/:id/tweet/:type/:category/", userTweetController.tweet_index);
router.post("/users/:id/tweet/:tweetId/update", userTweetController.user_update_tweet);


module.exports = router;
