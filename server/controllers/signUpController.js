// requiring/importing passport and the 'User' model
const passport = require("../middleware/auth/auth");
const User = require("../models/user");

// create a new user
exports.user_create = (req, res)=>{
    const {email, password, socketId} = req.body;

    // registering the new user
    User.register(new User({ email: email, socketId: socketId}), password, (err, user)=>{
        
        if (err) return res.status(409).json({"error": err.message});
        
        // using passport to authenticate the user
        passport.authenticate("local")(req, res, () =>{

            // assigning a username by default to the new user
            User.findByIdAndUpdate({_id: req.user._id}, {$set: {username: `user${req.user._id}`}}, {new: true}, (err, loggedInUser) => {
                if (err) { return next(err); }

                // returning the created logged-in user
                return res.status(200).json({user: loggedInUser});
            });
        });

    });

}
