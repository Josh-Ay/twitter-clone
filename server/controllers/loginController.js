const passport = require("../middleware/auth/auth");
const User = require("../models/user");

// login a user
exports.login_user = (req, res, next) => {
    passport.authenticate("local", (err, user, info)=>{
        if (err) { return next(err); }
        if (!user) { return res.status(401).json({"error": info.message}); }

        req.login(user, (err) => {
            if (err) { return next(err); };

            User.findByIdAndUpdate({ _id: req.user._id }, {$set: { socketId: req.body.socketId }  }, {new: true, fields: { "email": 0, "tweets": 0, "retweets": 0, "likedTweets": 0, "savedTweets": 0 }}, (err, loggedInUser) => {
                if (err) { return next(err); }
                return res.status(200).json({user: loggedInUser});
            });
        });
    })(req, res, next);
}
