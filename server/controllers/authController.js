const User = require("../models/user");

// get the details of an oauth user
exports.get_user_details = async (req, res) => {
    if (req.user){

        await User.findById({_id: req.user._id}, (err, foundUser) => {
            if (err) return res.status(500).json({error: err.message});

            // if its a new user i.e(does not have a username yet)
            if (!foundUser.username){

                User.findByIdAndUpdate({_id: req.user._id}, {$set: {username: `user${req.user._id}`}}, {new: true}, (err, updatedUser) => {
                    if (err) return res.status(500).json({error: err.message});

                    return res.status(200).json({user: updatedUser});
                });

                return;

            }
            
            // if its a existing user i.e(already has a username)
            return res.status(200).json({user: foundUser});
        }).clone();
    }else{
        return res.status(401).json({message: "Unauthorized"});
    }
};

exports.get_failed_response = (req, res) => {
    return res.status(401).json({"message": "User authentication failed"});
}
