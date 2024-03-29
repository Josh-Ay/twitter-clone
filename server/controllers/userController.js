// requiring the necessary packages and model
const User = require("../models/user");
const Tweet = require("../models/tweet").Tweet;
const mongoose = require("mongoose");
const CryptoJS = require("crypto-js");
const awsS3Client = require("../middleware/upload/amazonS3Upload");
const { Readable } = require("stream");
const fs = require("fs");
const { shuffleArray, isMongooseIdValid } = require("../helpers/helper");
const Message = require("../models/message").Message;
const Comment = require("../models/comment").Comment;

// get all users
exports.user_index = (req, res) => {
    User.find({}, {"_id": 0, "email": 1}).lean().exec( (err, users) => {
        if(err) return res.status(500).json({error: err.message});
        
        // encrypting the data returned because it contains all the emails of the existing users
        res.status(200).json({users: CryptoJS.AES.encrypt(JSON.stringify(users), process.env.AES_SECRET_KEY).toString()});
    })
};

// get all usernames
exports.username_index = (req, res) => {
    // get a user profile for a passed username
    if (req.query.username){
        // Used find().limit(1) instead of findOne() because from research, find().limit(1) is faster
        User.find({ username: req.query.username }).limit(1).lean().exec( (err, foundUser) => {
            if (err) return res.status(404).json({ error: err.message });

            return res.status(200).json({ user: foundUser });
        });

        return;
    }

    // get all usernames
    User.find({}, { "username": 1, "followers": 1, "following": 1, "displayName": 1 }).lean().exec( (err, usernames) => {
        if (err) return res.status(500).json({error: err.message});
        
        res.status(200).json({usernames: CryptoJS.AES.encrypt(JSON.stringify(usernames), process.env.AES_SECRET_KEY).toString()});
    })
};

// update existing user details
exports.user_update_detail = async (req, res) => {
    const { username, userBio, displayName } = req.body;
    
    try {
        // updating a user's username, displayName and bio
        await User.findByIdAndUpdate(req.params.id, {$set: { displayName: displayName, username: username, about: userBio }}, {new: true});
        
        // updating the user's details(user with _id of req.params.id) for all messages between the user and other users
        await Message.updateMany({"owner":  req.params.id}, { $set: {"displayName": displayName, "username": username }  }, {multi: true });
        
        // also updating the user's details(user with _id of req.params.id) in tweets the user has created
        await Tweet.updateMany({"authorId":  req.params.id}, { $set: {"author": displayName, "authorUsername": username }  }, { multi: true });
        
        // also updating the user's details(user with _id of req.params.id) in tweets the user has commented in
        await Comment.updateMany({"authorUserId": req.params.id}, { $set: {"author": displayName, "authorUsername": username} }, {multi: true });

        // getting the user with the user's updated details
        const updatedUserDetails = await User.findById({_id: req.params.id}, { "email": 0, "followers": 0, "following": 0 }).exec();
        return res.status(200).json({user: updatedUserDetails});

    } catch (error) {
        return res.status(500).json({error: err.message});
    }

};

// update user display photo
exports.user_update_display_photo = async (req, res) => {
    const imageFile = req.file;

    await awsS3Client.uploadToAws(imageFile).then(awsRes => {
        // deleting the image from the local server(multer 'uploads' directory) after successful upload to s3 bucket
        fs.unlink(imageFile.path, (err) => {
            if (err) console.log("Something went wrong while trying to delete the file");
            console.log("The file was deleted from local server successfully");
        });

        /** USER COVER PHOTO */
        if (req.body.coverPhoto){
            // adding the key of the object stored in the bucket to update the user's cover picture in the database
            User.findByIdAndUpdate({"_id": req.params.id}, {$set: {coverPhoto: awsRes.Key}}, async (err, user) => {
                if (err) return res.status(500).json({error: err.message});
                
                // if it's a new user, i.e. the user did not have a previous cover photo
                if (!user.coverPhoto){
                    try {
                        const foundUser = await User.findById({"_id": req.params.id}, { "email": 0, "followers": 0, "following": 0 });
                        return res.status(200).json({user: foundUser});
                    } catch (err) {
                        return res.status(500).json({error: err.message});
                    }
                }

                // if it's an existing user with a previous cover photo, then delete the previous one
                await awsS3Client.deleteFileInAwsBucket(user.coverPhoto).then(awsDelRes => {
                    console.log("successfully deleted file in aws bucket");

                    try {
                        const foundUser = User.findById({"_id": req.params.id}, { "email": 0, "followers": 0, "following": 0 });
                        return res.status(200).json({user: foundUser});
                    } catch (err) {
                        return res.status(500).json({error: err.message});   
                    }

                }).catch(err => {
                    console.log(err);
                });

            });

        }

        /** USER PROFILE PHOTO */
        else{
            // adding the key of the object stored in the bucket to update the user's profile picture in the database
            User.findByIdAndUpdate({"_id": req.params.id}, {$set: {profilePhoto: awsRes.Key}}, async (err, user) => {
                if (err) return res.status(500).json({error: err.message});
                
                // if it's a new user, i.e. the user did not have a previous profile photo or if the user's former profile photo was gotten via oauth authentication (from an external source)
                if ((!user.profilePhoto) || (user.profilePhoto.includes("https://"))){
                    try {
                        await Tweet.updateMany({ "authorId" : req.params.id }, {$set: {"authorImage": awsRes.Key }}, { multi: true });
                    
                        await Comment.updateMany({"authorUserId": req.params.id}, {$set: {"authorImage": awsRes.Key}}, {multi: true });
                                
                        await Message.updateMany({"owner": req.params.id}, {$set: {"profilePhoto": awsRes.Key} }, { multi: true });
                                    
                        const foundUser = await User.findById({"_id": req.params.id}, { "email": 0, "followers": 0, "following": 0 });
                        return res.status(200).json({user: foundUser});

                    } catch (err) {
                        return res.status(500).json({error: err.message});
                    }
                }

                // if it's an existing user with a previous profile photo, then delete the previous one
                await awsS3Client.deleteFileInAwsBucket(user.profilePhoto).then(awsDelRes => {
                    console.log("successfully deleted file in aws bucket");
                }).catch(err => {
                    console.log(err);
                });

                try {
                    // updating the user's picture in all created tweets
                    await Tweet.updateMany({ "authorId" : req.params.id }, {$set: {"authorImage": awsRes.Key }}, { multi: true });
                        
                    await Comment.updateMany({"authorUserId": req.params.id}, {$set: {"authorImage": awsRes.Key}}, {multi: true });

                    await Message.updateMany({"owner": req.params.id}, {$set: {"profilePhoto": awsRes.Key} }, { multi: true });
                
                    // returning the updated user
                    const foundUser = await User.findById({"_id": req.params.id}, { "email": 0, "followers": 0, "following": 0 });
                    return res.status(200).json({user: foundUser});
                } catch (error) {
                    return res.status(500).json({error: err.message});
                }
            });
        }
    }).catch(err => {
        return res.status(500).json({error: "An error occurred while trying to upload your file."})
    });
};

// display media photo
exports.get_media_file = async (req, res) => {
    const fileKey = req.params.key;

    await awsS3Client.getFileFromAws(fileKey).then(awsRes => {
        // creating a readable stream from the response body(which is a Buffer i.e <Buffer>... ) gotten back
        const readStream = Readable.from(awsRes.Body);

        // piping the stream directly into the response
        readStream.pipe(res);

    }).catch(err => {
        return res.status(500).json({error: "An error occurred while trying to get your file."})
    });

}

// get user follower suggestions
exports.get_user_follower_suggestions = async (req, res) => {
    const allUsers = await User.find({}).lean().exec();

    User.findById({_id: req.params.id}, async (err, foundUser) => {
        if (err) return res.status(404).json({error: err.message});

        if (!foundUser) return;
        
        // if the user does not yet have any followers or is not following anyone yet
        if ( (foundUser.following.length === 0) || (foundUser.followers.length === 0) ) return res.status(200).json({followerSuggestions: shuffleArray(allUsers).slice(0, 3)});

        // get the followers of who the user is following
        const [ randomFollowingIndex, randomFollowersIndex ] = [ Math.floor( Math.random() * foundUser.following.length ), Math.floor( Math.random() * foundUser.followers.length ) ];

        // getting a list of the random user's followers and following
        const [ randomUserFollowing, randomUserFollower ] = [ foundUser.following[randomFollowingIndex], foundUser.followers[randomFollowersIndex] ];
        
        const suggestionsListOne = await (await User.findById({ _id: randomUserFollowing})).following;
        const suggestionsListTwo = await (await User.findById({ _id: randomUserFollowing})).followers;
        const suggestionsListThree = await (await User.findById({ _id: randomUserFollower})).following;
        const suggestionsListFour = await (await User.findById({ _id: randomUserFollower})).followers;
        
        // concatenating all the lists together and removing the current user's profile(if among the list of the suggested users)
        const newFollowersSuggestionList = suggestionsListOne.concat(suggestionsListTwo, suggestionsListThree, suggestionsListFour).filter(userSuggestion => userSuggestion !== req.params.id);
        
        const profilesOfNewFollowersSuggestionList = []
        newFollowersSuggestionList.forEach(async (suggestion) => {
            const foundUserProfile = await User.findById({_id: suggestion});
            if (!foundUserProfile) return
            profilesOfNewFollowersSuggestionList.push(foundUserProfile)
        });

        // if the suggestions list of people to follow is less than 3 then no need to shuffle it
        if ( (newFollowersSuggestionList.length < 1) || (newFollowersSuggestionList.length < 3) ) return res.status(200).json({followerSuggestions: profilesOfNewFollowersSuggestionList});
        
        // shuffling the suggestions list of people to follow, removing duplicate entries and picking the first 3
        const minifiedUniqueFollowersSuggestionList = [...new Set(shuffleArray(profilesOfNewFollowersSuggestionList).slice(0, 3))];

        return res.status(200).json({followerSuggestions: minifiedUniqueFollowersSuggestionList});
    })
}

// follow a user
exports.user_follow_user = async (req, res) => {
    if (!isMongooseIdValid(req.params.id) || !isMongooseIdValid(req.params.requestedUserId)) return res.status(400).json({ error: "Invalid mongoose id passed" });

    const newFollowerId = req.params.id;
    const userToFollowId = req.params.requestedUserId;

    const followerUserData = await User.findById({_id: newFollowerId});
    const followingUserData = await User.findById({_id: userToFollowId});

    if (!followerUserData || !followerUserData) return res.status(404).json({error: "User info not found"});

    try {
        // adding the new follower to the user's list of followers
        await User.findByIdAndUpdate({_id: userToFollowId}, {$push: {"followers": followerUserData._id.toString()} }, {new: true});
            
        // updating the user's(follower) list of following
        await User.findByIdAndUpdate({_id: newFollowerId}, {$push: {"following": followingUserData._id.toString()} }, {new: true});
        
        const userToFollowData = await User.findById({_id: userToFollowId}, { "email": 0 });
                                
        // returning the updated data for both the follower and the followed
        return res.status(200).json({"newFollower": followerUserData, "followedUser": userToFollowData});
    } catch (err) {
        return res.status(500).json({error: err.message});
    }
}

// get user's followers
exports.get_user_followers = async (req, res) => {
    const existingUser = await User.findById({_id: req.params.id});
    if (!existingUser) return res.status(404).json({error: "User not found"});

    const existingUserFollowersProfiles = await Promise.all(existingUser.followers.map(async (follower) => {
        const foundUserProfile = await User.findById({_id: follower});
        if (!foundUserProfile) return
        return foundUserProfile;
    }));

    return res.status(200).json({"followers": existingUserFollowersProfiles});
}

// get user's following
exports.get_user_following = async (req, res) => {
    const existingUser = await User.findById({_id: req.params.id});
    if (!existingUser) return res.status(404).json({error: "User not found"});

    const existingUserFollowingProfiles = await Promise.all(existingUser.following.map(async (following) => {
        const foundUserProfile = await User.findById({_id: following});
        if (!foundUserProfile) return
        return foundUserProfile;
    }));

    return res.status(200).json({"following": existingUserFollowingProfiles});
}

