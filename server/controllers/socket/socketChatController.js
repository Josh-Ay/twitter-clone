require("dotenv").config();

// requiring the 'User' model
const User = require("../../models/user");

// update user socket id
exports.user_update_socket_id = (currentUserId, passedSocketId, currentUserUsername, callback) => {
    // updating the socketId of the user('currentUserUsername')
    User.findByIdAndUpdate({ _id: currentUserId }, { $set: { socketId: passedSocketId } }, {new: true}, (err, updatedUser) => {
        if (err) return callback({error: err.message});

        // also updating the socketId in other user records where that is following the user('currentUserUsername') or being followed by the user('currentUserUsername')
        User.updateMany({$and:  [{"following.username" : currentUserUsername}, {"followers.username": currentUserUsername}] }, {$set: {"following.$.socketId": passedSocketId, "followers.$.socketId": passedSocketId }}, { multi: true, arrayFilters: [{"elem.username": currentUserUsername}] }, (err, updatedUsersCount) => {
            if (err) return callback({error: err.message});

            return callback({user: updatedUser});   
        });

    });
}

// get socketId
exports.get_socket_id = (userId, callback) => {
    User.findById({_id: userId}, (err, foundUser) => {
        if (err) return res.status(500).json({error: err.message});
        
        // returning the requested user's socketID
        return callback({userSocketId: foundUser.socketId});
    })
}
