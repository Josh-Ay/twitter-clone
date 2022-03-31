require("dotenv").config();

// requiring the necessary packages and model
const User = require("../models/user");
const Tweet = require("../models/tweet").Tweet;
const mongoose = require("mongoose");
const CryptoJS = require("crypto-js");
const awsS3Client = require("../middleware/upload/amazonS3Upload");
const { Readable } = require("stream");
const fs = require("fs");
const { shuffleArray } = require("../helpers/helper");

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
    User.find({}, { "username": 1, "followers": 1, "following": 1, "displayName": 1 }).lean().exec( (err, usernames) => {
        if (err) return res.status(500).json({error: err.message});
        
        res.status(200).json({usernames: CryptoJS.AES.encrypt(JSON.stringify(usernames), process.env.AES_SECRET_KEY).toString()});
    })
};

// update existing user details
exports.user_update_detail = (req, res) => {
    const { username, userBio, displayName } = req.body;
    
    // updating a user's username, displayName and bio
    User.findByIdAndUpdate(req.params.id, {$set: { displayName: displayName, username: username, about: userBio }}, {new: true}, (err, updatedUser) => {
        if (err) return res.status(500).json({error: err.message});

        // also updating the user's details(user with _id of req.params.id) in other users accounts' where the user is a follower
        User.updateMany({"followers._id":  mongoose.Types.ObjectId(req.params.id)}, { $set: {"followers.$.displayName": displayName, "followers.$.username": username, "followers.$.about": userBio }  }, { multi: true },(err, updatedUsers) => {
            if (err) return res.status(500).json({error: err.message});

            // also updating the user's details(user with _id of req.params.id) in other users accounts' wherever the user is being followed
            User.updateMany({"following._id":  mongoose.Types.ObjectId(req.params.id)}, { $set: {"following.$.displayName": displayName, "following.$.username": username, "following.$.about": userBio }  }, { multi: true }, (err, updatedUsers) => {
                if (err) return res.status(500).json({error: err.message});

                // also updating the user's details(user with _id of req.params.id) for all messages between the user and other users
                User.updateMany({"messages.userId":  req.params.id}, { $set: {"messages.$.displayName": displayName, "messages.$.username": username }  }, {multi: true }, (err, updatedUsers) => {
                    if (err) return res.status(500).json({error: err.message});

                    // also updating the user's details(user with _id of req.params.id) in tweets the user has created
                    User.updateMany({"tweets.authorId":  req.params.id}, { $set: {"tweets.$[tweet].author": displayName, "tweets.$[tweet].authorUsername": username }  }, { multi: true, "arrayFilters": [{"tweet.authorId": req.params.id}] }, (err, updatedUsers) => {
                        if (err) return res.status(500).json({error: err.message});

                        // also updating the user's details(user with _id of req.params.id) in tweets the user has retweeted
                        User.updateMany({"retweets.authorId": req.params.id}, { $set: { "retweets.$[retweet].author": displayName, "retweets.$[retweet].authorUsername": username } }, { multi: true, "arrayFilters": [{"retweet.authorId": req.params.id}] }, (err, updatedUsers) => {
                            if (err) return res.status(500).json({error: err.message});

                            // also updating the user's details(user with _id of req.params.id) in tweets the user has commented in
                            User.updateMany({"tweets.comments.authorUserId": req.params.id}, { $set: {"tweets.$.comments.$[comment].author": displayName, "tweets.$.comments.$[comment].authorUsername": username} }, {multi: true, "arrayFilters": [ {"comment.authorUserId": req.params.id} ]}, (err, updatedUsers) => {
                                if (err) return res.status(500).json({error: err.message});
    
                                // also updating the user's details(user with _id of req.params.id) in the tweets model
                                Tweet.updateMany({"authorId": req.params.id}, { $set: {"author": displayName, "authorUsername": username }  }, (err, updatedTweets) => {
                                    if (err) return res.status(500).json({error: err.message});
        
                                    // also updating the user's details(user with _id of req.params.id) in tweets the user has commented in(in the tweets model)
                                    Tweet.updateMany({"comments.authorUserId":  req.params.id}, { $set: {"comments.$[comment].author": displayName, "comments.$[comment].authorUsername": username }  }, { multi: true, "arrayFilters": [{"comment.authorUserId": req.params.id}] }, async (err, updatedTweets) => {
                                        if (err) return res.status(500).json({error: err.message});
                                        
                                        // getting the user with the user's updated details
                                        const updatedUserDetails = await User.findById({_id: req.params.id}, { "email": 0, "tweets": 0, "retweets": 0, "likedTweets": 0, "savedTweets": 0, "messages": 0, "followers": 0, "following": 0 }).exec();

                                        return res.status(200).json({user: updatedUserDetails});
                                    })
        
                                })
                            })
                        })
                    })

                    
                })
            })
        })
        
    });
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
                    User.findById({"_id": req.params.id}, { "email": 0, "tweets": 0, "retweets": 0, "likedTweets": 0, "savedTweets": 0, "messages": 0, "followers": 0, "following": 0 }, (err, foundUser) => {
                        if (err) return res.status(500).json({error: err.message});

                        return res.status(200).json({user: foundUser});
                    });
                    return;
                }

                // if it's an existing user with a previous cover photo, then delete the previous one
                await awsS3Client.deleteFileInAwsBucket(user.coverPhoto).then(awsDelRes => {
                    console.log("successfully deleted file in aws bucket");

                    User.findById({"_id": req.params.id}, { "email": 0, "tweets": 0, "retweets": 0, "likedTweets": 0, "savedTweets": 0, "messages": 0, "followers": 0, "following": 0 }, (err, foundUser) => {
                        if (err) return res.status(500).json({error: err.message});

                        return res.status(200).json({user: foundUser});
                    })

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
                    User.updateMany({ "tweets.authorId" : req.params.id }, {$set: {"tweets.$[elem].authorImage": awsRes.Key }}, { multi: true, "arrayFilters": [{"elem.authorId": req.params.id}] }, (err, updatedUsers) => {
                        if (err) return res.status(500).json({error: err.message});
    
                        User.updateMany({"tweets.comments.authorUserId": req.params.id}, {$set: {"tweets.$.comments.$[comment].authorImage": awsRes.Key}}, {multi: true, "arrayFilters": [{"comment.authorUserId": req.params.id} ]}, (err, updatedUsers) => {
                            if (err) return res.status(500).json({error: err.message});
    
                            User.updateMany({"messages.userId": req.params.id}, {$set: {"messages.$.profilePhoto": awsRes.Key} }, { multi: true }, (err, updatedUsers) => {
                                if (err) return res.status(500).json({error: err.message});
    
                                Tweet.updateMany({"authorId": req.params.id}, {$set: {"authorImage": awsRes.Key} }, (err, updatedTweets) => {
                                    if (err) return res.status(500).json({error: err.message});
    
                                    Tweet.updateMany({"comments.authorUserId": req.params.id}, {$set: {"comments.$[comment].authorImage": awsRes.Key} }, { multi:true, "arrayFilters": [ {"comment.authorUserId": req.params.id} ]}, (err, updatedTweets) => {
                                        if (err) return res.status(500).json({error: err.message});

                                        User.findById({"_id": req.params.id}, { "email": 0, "tweets": 0, "retweets": 0, "likedTweets": 0, "savedTweets": 0, "messages": 0, "followers": 0, "following": 0 }, (err, foundUser) => {
                                            if (err) return res.status(500).json({error: err.message});
                    
                                            return res.status(200).json({user: foundUser});
                                        });
                                    })
                                })
                            })
                        })
                    })
                    
                    return;
                }

                // if it's an existing user with a previous profile photo, then delete the previous one
                await awsS3Client.deleteFileInAwsBucket(user.profilePhoto).then(awsDelRes => {
                    console.log("successfully deleted file in aws bucket");
                }).catch(err => {
                    console.log(err);
                });

                // updating the user's picture in all created tweets
                User.updateMany({ "tweets.authorId" : req.params.id }, {$set: {"tweets.$[elem].authorImage": awsRes.Key }}, { multi: true, "arrayFilters": [{"elem.authorId": req.params.id}] }, (err, updatedUsers) => {
                    if (err) return res.status(500).json({error: err.message});

                    User.updateMany({"tweets.comments.authorUserId": req.params.id}, {$set: {"tweets.$.comments.$[comment].authorImage": awsRes.Key}}, {multi: true, "arrayFilters": [ {"comment.authorUserId": req.params.id} ]}, (err, updatedUsers) => {
                        if (err) return res.status(500).json({error: err.message});

                        User.updateMany({"messages.userId": req.params.id}, {$set: {"messages.$.profilePhoto": awsRes.Key} }, { multi: true }, (err, updatedUsers) => {
                            if (err) return res.status(500).json({error: err.message});

                            Tweet.updateMany({"authorId": req.params.id}, {$set: {"authorImage": awsRes.Key} }, (err, updatedTweets) => {
                                if (err) return res.status(500).json({error: err.message});

                                Tweet.updateMany({"comments.authorUserId": req.params.id}, {$set: {"comments.$[comment].authorImage": awsRes.Key} }, { multi:true, "arrayFilters": [ {"comment.authorUserId": req.params.id} ]}, (err, updatedTweets) => {
                                    if (err) return res.status(500).json({error: err.message});

                                    // returning the updated user
                                    User.findById({"_id": req.params.id}, { "email": 0, "tweets": 0, "retweets": 0, "likedTweets": 0, "savedTweets": 0, "messages": 0, "followers": 0, "following": 0 }, (err, foundUser) => {
                                        if (err) return res.status(500).json({error: err.message});
                                        
                                        return res.status(200).json({user: foundUser});
                                    })
                                })
                            })
                        })
                    })
                    
                })

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

    User.findById({_id: req.params.id}, {"messages": 0}, (err, foundUser) => {
        if (err) return res.status(404).json({error: err.message});

        if (!foundUser) return;
        
        // if the user does not yet have any followers or is not following anyone yet
        if ( (foundUser.following.length === 0) || (foundUser.followers.length === 0) ) return res.status(200).json({followerSuggestions: shuffleArray(allUsers).slice(0, 3)});

        // get the followers of who the user is following
        const [ randomFollowingIndex, randomFollowersIndex ] = [ Math.floor( Math.random() * foundUser.following.length ), Math.floor( Math.random() * foundUser.followers.length ) ];

        // getting a list of the random user's followers and following
        const suggestionsListOne = foundUser.following[randomFollowingIndex].following;
        const suggestionsListTwo = foundUser.following[randomFollowingIndex].followers;
        const suggestionsListThree = foundUser.followers[randomFollowersIndex].following;
        const suggestionsListFour = foundUser.followers[randomFollowersIndex].followers;
        
        // concatenating all the lists together and removing the current user's profile(if among the list of the suggested users)
        const newFollowersSuggestionList = suggestionsListOne.concat(suggestionsListTwo, suggestionsListThree, suggestionsListFour).filter(userSuggestion => userSuggestion._id.toString() !== req.params.id);
        
        // if the suggestions list of people to follow is less than 3 then no need to shuffle it
        if ( (newFollowersSuggestionList.length < 1) || (newFollowersSuggestionList.length < 3) ) return res.status(200).json({followerSuggestions: newFollowersSuggestionList});
        
        // shuffling the suggestions list of people to follow, removing duplicate entries and picking the first 3
        const minifiedUniqueFollowersSuggestionList = [...new Set(shuffleArray(newFollowersSuggestionList).slice(0, 3))];

        return res.status(200).json({followerSuggestions: minifiedUniqueFollowersSuggestionList});
    })
}

// follow a user
exports.user_follow_user = async (req, res) => {
    const newFollowerId = req.params.id;
    const userToFollowId = req.params.requestedUserId;

    const followerUserData = await User.findById({_id: newFollowerId});

    // adding the new follower to the user's list of followers
    User.findByIdAndUpdate({_id: userToFollowId}, {$push: {"followers": followerUserData} }, {new: true}, (err, userToFollow) => {
        if (err) return res.status(500).json({error: err.message});
        
        // updating the user's(follower) list of following
        User.findByIdAndUpdate({_id: newFollowerId}, {$push: {following: userToFollow} }, {new: true}, (err, newFollowerData) => {
            if (err) return res.status(500).json({error: err.message});

            // also adding the new follower to wherever the 'user to be followed' is being followed in other users accounts
            User.updateMany({"following._id": mongoose.Types.ObjectId(userToFollowId)}, {$push: {"following.$.followers": followerUserData}}, (err, updatedUsers) => {
                if (err) return res.status(500).json({error: err.message});
            
                // adding the new follower to wherever the 'user to be followed' appears as a follower in other users accounts 
                User.updateMany({"followers._id": mongoose.Types.ObjectId(userToFollowId)}, {$push: {"followers.$.followers": followerUserData} }, (err, updatedUsers) => {
                    if (err) return res.status(500).json({error: err.message});

                    // also updating the new follower's list of following wherever the new follower is being followed in other users accounts
                    User.updateMany({"following._id": mongoose.Types.ObjectId(newFollowerId)}, {$push: {"following.$.following": userToFollow} }, (err, updatedUsers) => {
                        if (err) return res.status(500).json({error: err.message});
                        
                        // also updating the new follower's list of following wherever the new follower appears as a follower in other users accounts
                        User.updateMany({"followers._id": mongoose.Types.ObjectId(newFollowerId)}, {$push: {"followers.$.following": userToFollow}}, async (err, updatedUsers) => {
                            if (err) return res.status(500).json({error: err.message});
                    
                            const userToFollowData = await User.findById({_id: userToFollowId}, { "email": 0, "tweets": 0, "retweets": 0, "likedTweets": 0, "savedTweets": 0, "messages": 0, "followers": 0, "following": 0 });
                            
                            // returning the updated data for both the follower and the followed
                            return res.status(200).json({"newFollower": newFollowerData, "followedUser": userToFollowData});
                            
                        })
                        
                    });
                })
            })

        })

    });
}

// get user's followers
exports.get_user_followers = async (req, res) => {
    User.findById({_id: req.params.id}, {"messages": 0}, (err, currentUser) => {
        if (err) return res.status(500).json({error: err.message});

        return res.status(200).json({"followers": currentUser.followers});
    });
}

// get user's following
exports.get_user_following = async (req, res) => {
    User.findById({_id: req.params.id}, {"messages": 0}, (err, currentUser) => {
        if (err) return res.status(500).json({error: err.message});

        return res.status(200).json({"following": currentUser.following});
    });
}

