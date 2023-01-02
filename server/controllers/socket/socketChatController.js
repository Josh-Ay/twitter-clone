// requiring the 'User' model
const User = require("../../models/user");

// update user socket id
exports.user_update_socket_id = async (currentUserId, passedSocketId, callback) => {
    // updating the socketId of the user('currentUserUsername')
    const existingUser = await User.findById({_id: currentUserId});
    if (!existingUser) return callback({error: "User not found"});

    if (!existingUser.socketId) {
        existingUser.socketId = passedSocketId;
        await existingUser.save();
    }
    if (!existingUser.username) {
        existingUser.username = `user${existingUser._id.toString()}`;
        await existingUser.save();
    }
    
    return callback({user: existingUser});
}

// get socketId
exports.get_socket_id = (userId, callback) => {
    User.findById({_id: userId}, (err, foundUser) => {
        if (err) return res.status(500).json({error: err.message});
        
        // returning the requested user's socketID
        return callback({userSocketId: foundUser.socketId});
    })
}
