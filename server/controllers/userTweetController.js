// requiring the necessary packages and models
const mongoose = require("mongoose");
const User = require("../models/user");
const Tweet = require("../models/tweet").Tweet;
const Comment = require("../models/comment").Comment;
const awsS3Client = require("../middleware/upload/amazonS3Upload");
const fs = require("fs");
const { shuffleArray, get_top_occurences_in_array, get_unique_items_in_list_of_objects } = require("../helpers/helper")

// create a new tweet for a user
exports.user_create_tweet_post = async (req, res) => {
    const userId = req.params.id;
    
    // if there was no image attached with the tweet
    if(!req.file){

        // creating a new document(tweet) using the 'Tweet' model
        const newTweet = new Tweet({
            author: req.body.author,
            authorImage: req.body.authorImage,
            authorUsername: req.body.authorUsername,
            authorId: userId,
            tweetText: req.body.tweetText,
            tweetTextLowerCase: req.body.tweetText.toLocaleLowerCase(),
            visibility: req.body.visibility,
            tags: req.body.tags,
        });

        // adding the new tweet document to the user's tweets
        User.findByIdAndUpdate({_id: userId}, {$push: {"tweets": newTweet} }, (err, user) => {
            if (err) return res.status(404).json({error: err.message});

            // also adding the new tweet to the user's tweets list wherever the user is a follower
            User.updateMany({"followers._id": mongoose.Types.ObjectId(userId)}, {$push: {"followers.$.tweets": newTweet} }, (err, updatedUsers) => {
                if (err) return res.status(500).json({ error: err.message });

                // also adding the new tweet to the user's tweets list wherever the user is being followed
                User.updateMany({"following._id": mongoose.Types.ObjectId(userId)}, {$push: {"following.$.tweets": newTweet} }, (err, updatedUsers) => {
                    if (err) return res.status(500).json({ error: err.message });
                
                    // saving the new tweet to the tweets collection('Tweet' model)
                    newTweet.save((err, newTweetObj) => {
                        if (err) return res.status(500).json({error: err.message});
        
                        return res.status(200).json({newTweet: newTweetObj});
                    });
                })
            })

        });

    }else{
        const tweetImageFile = req.file;

        await awsS3Client.uploadToAws(tweetImageFile).then(awsRes => {
            // deleting the file from the local server
            fs.unlink(tweetImageFile.path, (err) => {
                if (err) console.log("An error occured while trying to delete the file from the local server");
                console.log("The file was deleted from local server successfully");
            });
    
            // creating a new document(tweet) using the 'Tweet' model
            const newTweet = new Tweet({
                author: req.body.author,
                authorImage: req.body.authorImage,
                authorUsername: req.body.authorUsername,
                authorId: userId,
                tweetText: req.body.tweetText ? req.body.tweetText : "",
                image: awsRes.Key,
                visibility: req.body.visibility,
                tags: req.body.tags,
            });
    
            // adding the new tweet document with key of the image object that just got added to the aws bucket to the user's tweets
            User.findByIdAndUpdate({_id: userId}, {$push: {"tweets": newTweet}}, (err, user) => {
                if (err) return res.status(404).json({error: err.message});

                // also adding the new tweet to the user's tweets list wherever the user is a follower
                User.updateMany({"followers._id": mongoose.Types.ObjectId(userId)}, {$push: {"followers.$.tweets": newTweet} }, (err, updatedUsers) => {
                    if (err) return res.status(500).json({ error: err.message });

                    // also adding the new tweet to the user's tweets list wherever the user is being followed
                    User.updateMany({"following._id": mongoose.Types.ObjectId(userId)}, {$push: {"following.$.tweets": newTweet} }, (err, updatedUsers) => {
                        if (err) return res.status(500).json({ error: err.message });
                    
                        // saving the new tweet to the tweets collection('Tweet' model)
                        newTweet.save((err, newTweetObj) => {
                            if (err) return res.status(500).json({error: err.message});
            
                            return res.status(200).json({newTweet: newTweetObj});
                        });
                    })
                })

            });
    
        }).catch(err => {
            return res.status(500).json({error: "An error occurred while trying to upload the file."});
        });
    
    }
    
    
}

// get all tweets of a user's followers and following
exports.user_get_follow_tweet = (req, res) => {
    const userId = req.params.id;

    User.findById({_id: userId}, async (err, user) => {
        if (err) return res.status(404).json({error: err.message});

        if(!user) return;

        // getting all the tweets and retweets of the current user, user's followers and following 
        if (user.followers.length === 0 && user.following.length === 0){
            const allTweets = await Tweet.find({}).lean().sort({_id: -1}).exec();

            return res.status(200).json({
                userTweets: user.tweets,
                userRetweets: user.retweets,
                userLikedTweets: user.likedTweets,
                userSavedTweets: user.savedTweets,
                tweets: get_unique_items_in_list_of_objects(user.tweets.concat(user.retweets, allTweets), "_id").reverse(),
            })
        }

        // sending the tweets and retweets back as response
        return res.status(200).json({
            userTweets: user.tweets,
            userRetweets: user.retweets,
            userLikedTweets: user.likedTweets,
            userSavedTweets: user.savedTweets,
            tweets: get_unique_items_in_list_of_objects(
                user.tweets.concat( 
                user.retweets,
                user.followers.map(allTweets => allTweets.tweets),
                user.following.map(allTweets => allTweets.tweets),
                user.followers.map(allRetweets => allRetweets.retweets), 
                user.following.map(allRetweets => allRetweets.retweets)
                ).flat(), "_id"
            ).reverse()
        });
    })
}


// get all tweets of a user
exports.get_user_tweet_index = async (req, res) => {
    const userId = req.params.id;
    const tweetType = req.params.type;
    const currentUserProfile = await User.findById({_id: userId}).exec();
    
    if (!currentUserProfile) return res.status(404).json({error: "Current user profile does not exist"});

    switch (tweetType) {
        // getting the tweets of a user
        case "tweets":
            res.status(200).json({
                tweets: currentUserProfile.tweets.concat(currentUserProfile.retweets).reverse(),
                userTweets: currentUserProfile.tweets,
                userRetweets: currentUserProfile.retweets,
                userLikedTweets: currentUserProfile.likedTweets,
                userSavedTweets: currentUserProfile.savedTweets
            });
            break;
        
        // getting the tweets, retweets of the user and the tweets where the user has commented
        case "tweets+replies":
            Tweet.find({"comments.authorUserId": mongoose.Types.ObjectId(userId)}, (err, matchingTweets) => {
                if (err) return res.status(500).json({error: err.message});

                return res.status(200).json({
                    tweets: currentUserProfile.tweets.concat(currentUserProfile.retweets, matchingTweets).reverse(),
                    userTweets: currentUserProfile.tweets,
                    userRetweets: currentUserProfile.retweets,
                    userLikedTweets: currentUserProfile.likedTweets,
                    userSavedTweets: currentUserProfile.savedTweets
                });
            })
            break;

        // getting the tweets of the current user that have images
        case "media":
            Tweet.find({"image": {$exists: true, $ne: ""}, authorUsername: currentUserProfile.username}, (err, matchingTweetsWithMedia) => {
                if (err) return res.status(500).json({error: err.message});
                
                return res.status(200).json({
                    tweets: matchingTweetsWithMedia.reverse(),
                    userTweets: currentUserProfile.tweets,
                    userRetweets: currentUserProfile.retweets,
                    userLikedTweets: currentUserProfile.likedTweets,
                    userSavedTweets: currentUserProfile.savedTweets
                });
            })
            break;
        
        // getting the tweets that the user has liked 
        case "likes":
            res.status(200).json({
                tweets: currentUserProfile.likedTweets.reverse(),
                userTweets: currentUserProfile.tweets,
                userRetweets: currentUserProfile.retweets,
                userLikedTweets: currentUserProfile.likedTweets,
                userSavedTweets: currentUserProfile.savedTweets
            });
            break;
        default:
            res.status(400).json({error: "Bad request"});
            break;
    }
}

// get a specific category of tweets for a user
exports.tweet_index = async (req, res) => {
    const userId = req.params.id;
    const typeOfTweet = req.params.type;
    const categoryToGet = req.params.category;

    // bookmarks
    if (typeOfTweet === "bookmarks"){
        const currentUserProfile = await User.findById({_id: userId}).exec();
    
        switch (categoryToGet) {
            // getting the saved tweets of a user
            case "tweets":
                res.status(200).json({
                    tweets: currentUserProfile.savedTweets.reverse(),
                    userTweets: currentUserProfile.tweets,
                    userRetweets: currentUserProfile.retweets,
                    userLikedTweets: currentUserProfile.likedTweets,
                    userSavedTweets: currentUserProfile.savedTweets
                })
                break;
            
            // getting the saved tweets of a user that have comments
            case "tweets+replies":
                res.status(200).json({
                    tweets: currentUserProfile.savedTweets.filter(tweet => tweet.comments.length !== 0).reverse(),
                    userTweets: currentUserProfile.tweets,
                    userRetweets: currentUserProfile.retweets,
                    userLikedTweets: currentUserProfile.likedTweets,
                    userSavedTweets: currentUserProfile.savedTweets
                });
                
                break;
            
            // getting the saved tweets of a user that have an image
            case "media":
                res.status(200).json({
                    tweets: currentUserProfile.savedTweets.filter(tweet => tweet.image).reverse(),
                    userTweets: currentUserProfile.tweets,
                    userRetweets: currentUserProfile.retweets,
                    userLikedTweets: currentUserProfile.likedTweets,
                    userSavedTweets: currentUserProfile.savedTweets
                });

                break;
            
            // getting the saved tweets of a user that was liked by the user
            case "likes":
                res.status(200).json({
                    tweets: currentUserProfile.savedTweets.filter(tweet => currentUserProfile.likedTweets.filter(likedTweet => likedTweet._id === tweet._id)).reverse(),
                    userTweets: currentUserProfile.tweets,
                    userRetweets: currentUserProfile.retweets,
                    userLikedTweets: currentUserProfile.likedTweets,
                    userSavedTweets: currentUserProfile.savedTweets
                });
                break;
            default:
                res.status(400).json({error: "Bad request"});
                break;
        }

        // explore 
    } else if (typeOfTweet === "explore"){
        const allTweets = await Tweet.find({}).lean().exec();
        const currentUserProfile = await User.findById({_id: userId}).exec();

        switch (categoryToGet) {
            // getting the top tweets for a user sorted by a 'tweetScore'
            case "top":
                res.status(200).json({
                    tweets: allTweets.sort((a, b) => b.tweetScore - a.tweetScore),
                    userTweets: currentUserProfile.tweets,
                    userRetweets: currentUserProfile.retweets,
                    userLikedTweets: currentUserProfile.likedTweets,
                    userSavedTweets: currentUserProfile.savedTweets
                });
                break;

            // getting the latest tweets for a user
            case "latest":
                res.status(200).json({
                    tweets: allTweets.reverse(),
                    userTweets: currentUserProfile.tweets,
                    userRetweets: currentUserProfile.retweets,
                    userLikedTweets: currentUserProfile.likedTweets,
                    userSavedTweets: currentUserProfile.savedTweets
                })
                break;
            
            // getting other's users
            case "people":
                const allUsers = await User.find({}).lean().exec();
                
                res.status(200).json({users: allUsers.sort((a, b) => b.followers - a.followers)});
                break;
            
            // getting tweets that have an image
            case "media":
                res.status(200).json({
                    tweets: allTweets.filter(tweet => tweet.image).reverse(),
                    userTweets: currentUserProfile.tweets,
                    userRetweets: currentUserProfile.retweets,
                    userLikedTweets: currentUserProfile.likedTweets,
                    userSavedTweets: currentUserProfile.savedTweets
                })
                break;
            
            default:
                break;
        }
    }else{
        return res.status(404).json({message: "Requested type not found"});
    }
};

// handle user update on tweet
exports.user_update_tweet = (req, res) => {
    const userId = req.params.id;
    const tweetId = req.params.tweetId;
    const typeOfAction = req.body.action;

    if (!typeOfAction) return res.status(500).json({message: "request missing 'typeOfAction' parameter in body"});
    
    switch (typeOfAction) {
        // if the type of action inititiated by the user was to add a new comment
        case "comment":
            // finding the tweet to be updated
            Tweet.findById({_id: tweetId}, async (err, foundTweet) => {
                if (err) return res.status(500).json({err: err.message});

                // creating a new comment document using the 'Comment' model
                const newComment = new Comment({
                    author: req.body.author,
                    authorImage: req.body.authorImage,
                    authorUsername: req.body.authorUsername,
                    authorUserId: req.body.authorUserId,
                    commentText: req.body.commentText,
                    image: ""
                });

                // if there was no image attached to the comment
                if (!req.file){
                    // adding the comment to the comments array of the tweet to be updated and saving it
                    foundTweet.comments.push(newComment);
                    foundTweet.save(err => {
                        if (err) return res.status(500).json({error: err.message});

                        // also adding the comment to the comments array of the author of the tweet to be updated
                        User.findOneAndUpdate({"tweets._id": mongoose.Types.ObjectId(tweetId) }, {$push: {"tweets.$.comments": newComment} }, {new: true}, (err, updatedUser) => {
                            if (err) return res.status(500).json({error: err.message});

                            return res.status(200).json({updatedTweets: 
                                get_unique_items_in_list_of_objects(
                                    updatedUser.tweets.concat(
                                        updatedUser.retweets, 
                                        updatedUser.followers.map(allTweets => allTweets.tweets), 
                                        updatedUser.following.map(allTweets => allTweets.tweets), 
                                        updatedUser.followers.map(allRetweets => allRetweets.retweets), 
                                        updatedUser.following.map(allRetweets => allRetweets.retweets)
                                    ).flat(), "_id"
                                ).reverse()
                            })
                        });
                    });

                    return;
                }

                // if there was image attached to the comment
                await awsS3Client.uploadToAws(req.file).then(awsRes => {
                    // deleting the file from the local server
                    fs.unlink(tweetImageFile.path, (err) => {
                        if (err) console.log("An error occured while trying to delete the file from the local server");
                        console.log("The file was deleted from local server successfully");
                    });

                    // updating the comment document created above to add the key(of the image attached) gotten back from aws
                    newComment.image = awsRes.Key;

                    // adding the comment to the comments array of the tweet to be updated and saving it
                    foundTweet.comments.push(newComment);
                    foundTweet.save(err => {
                        if (err) return res.status(500).json({error: err.message});

                        // also adding the comment to the comments array of the author of the tweet to be updated
                        User.findOneAndUpdate({"tweets._id": mongoose.Types.ObjectId(tweetId) }, {$push: {"tweets.$.comments": newComment} }, {new: true}, (err, updatedUser) => {
                            if (err) return res.status(500).json({error: err.message});
                            return res.status(200).json({updatedTweets: 
                                get_unique_items_in_list_of_objects(
                                    updatedUser.tweets.concat(
                                        updatedUser.retweets, 
                                        updatedUser.followers.map(allTweets => allTweets.tweets), 
                                        updatedUser.following.map(allTweets => allTweets.tweets), 
                                        updatedUser.followers.map(allRetweets => allRetweets.retweets), 
                                        updatedUser.following.map(allRetweets => allRetweets.retweets)
                                    ).flat(), "_id"
                                ).reverse()
                            })
                        });
                    });
            
                }).catch(err => {
                    return res.status(500).json({error: "An error occurred while trying to upload the file."});
                });
            })
            break;
        
        // if the type of action inititiated by the user was to like a tweet
        case "like":
            // finding the tweet to be updated
            Tweet.findByIdAndUpdate({_id: tweetId}, { $inc: {tweetScore: 1} }, (err, updatedTweet) => {
                if (err) return res.status(500).json({err: err.message});
            
                User.findByIdAndUpdate({_id: userId}, {$push: {likedTweets: updatedTweet} }, {new: true}, (err, updatedUser) => {
                    if (err) return res.status(500).json({error: err.message});

                    return res.status(200).json({updatedLikedTweets: updatedUser.likedTweets.reverse()});
                });
            
            })
            break;

        // if the type of action inititiated by the user was to unlike a tweet
        case "unlike":
            // finding the tweet to be updated
            User.findByIdAndUpdate({_id: userId}, { $pull: { likedTweets: {_id: tweetId} } }, {new: true}, (err, updatedUser) => {
                if (err) return res.status(500).json({error: err.message});

                return res.status(200).json({updatedLikedTweets: updatedUser.likedTweets.reverse()});
            });
            break;

        // if the type of action inititiated by the user was to save a tweet
        case "save":
            // finding the tweet to be updated
            Tweet.findByIdAndUpdate({_id: tweetId}, { $inc: {timesSaved: 1, tweetScore: 1} }, (err, foundTweet) => {
                if (err) return res.status(500).json({err: err.message});
            
                User.findByIdAndUpdate({_id: userId}, {$push: {savedTweets: foundTweet} }, (err, updatedUser) => {
                    if (err) return res.status(500).json({error: err.message});

                    User.findOneAndUpdate({"savedTweets._id": mongoose.Types.ObjectId(tweetId)}, {$set: {"savedTweets.$.saved": true}, $inc: {"savedTweets.$.timesSaved": 1} }, {new: true}, (err, updatedUser) => {
                        if (err) return res.status(500).json({error: err.message});

                        User.findOneAndUpdate({"tweets._id": mongoose.Types.ObjectId(tweetId)}, { $inc: {"tweets.$.timesSaved": 1} }, {new: true}, (err, updatedUser) => {
                            if (err) return res.status(500).json({error: err.message});
    
                            return res.status(200).json({updatedSavedTweets: updatedUser.savedTweets.reverse()});
                        })
                    })     

                });
            
            })
            break;
        
        // if the type of action inititiated by the user was to unsave a tweet
        case "unsave":
            // finding the tweet to be updated
            User.findByIdAndUpdate({_id: userId}, { $pull: { savedTweets: {_id: tweetId} } }, {new: true}, (err, updatedUser) => {
                if (err) return res.status(500).json({error: err.message});

                return res.status(200).json({updatedSavedTweets: updatedUser.savedTweets.reverse()});
            });
            break;
        
        // if the type of action inititiated by the user was to retweet a tweet
        case "retweet":
            // finding the tweet to be updated
            Tweet.findByIdAndUpdate({_id: tweetId}, { $inc: {retweets: 1, tweetScore: 1} }, (err, foundTweet) => {
                if (err) return res.status(500).json({err: err.message});
            
                User.findByIdAndUpdate({_id: userId}, {$push: {retweets: foundTweet} }, (err, updatedUser) => {
                    if (err) return res.status(500).json({error: err.message});

                    User.findOneAndUpdate({_id: userId, "retweets._id": mongoose.Types.ObjectId(tweetId)}, {$set: {"retweets.$.retweetAuthor": req.body.currentUserUsername, "retweets.$.retweeted": true}, $inc: {"retweets.$.retweets": 1} }, {new: true}, (err, updatedUser) => {
                        if (err) return res.status(500).json({error: err.message});

                        User.findOneAndUpdate({"tweets._id": mongoose.Types.ObjectId(tweetId)}, { $inc: {"tweets.$.retweets": 1} }, {new: true}, (err, updatedUser) => {
                            if (err) return res.status(500).json({error: err.message});
    
                            return res.status(200).json({updatedRetweets: updatedUser.retweets.reverse()});
                        })
                    })     

                });
            
            })
            break;

        // if the type of action inititiated by the user was to un-retweet a tweet
        case "unretweet":
            // finding the tweet to be updated
            User.findByIdAndUpdate({_id: userId}, { $pull: { retweets: {_id: tweetId} } }, {new: true}, (err, updatedUser) => {
                if (err) return res.status(500).json({error: err.message});

                return res.status(200).json({updatedRetweets: updatedUser.retweets.reverse()});
            });
            break;
        
        // if the type of action inititiated by the user was to like a comment
        case "like-comment":
            // finding the tweet to be updated
            Tweet.findOneAndUpdate({"comments._id": mongoose.Types.ObjectId(req.body.commentId)}, { $inc: {"comments.$.likes": 1}, $push: {"comments.$.usersThatLiked": userId} }, (err, updatedTweet) => {
                if (err) return res.status(500).json({err: err.message});
                
                User.findOneAndUpdate({"tweets.comments._id": mongoose.Types.ObjectId(req.body.commentId)}, {$push: {"tweets.$[tweet].comments.$[comment].usersThatLiked": userId}, $inc: {"tweets.$[tweet].comments.$[comment].likes": 1} }, {new: true, "arrayFilters": [{"tweet._id": tweetId}, {"comment._id": req.body.commentId} ]}, (err, updatedUser) => {
                    if (err) return res.status(500).json({error: err.message});

                    return res.status(200).json({updatedTweets: updatedUser.tweets.reverse()});
                })
            
            })
            break;
        
        // if the type of action inititiated by the user was to un-like a comment
        case "unlike-comment":
            Tweet.findOneAndUpdate({"comments._id": mongoose.Types.ObjectId(req.body.commentId)}, { $inc: {"comments.$.likes": -1}, $pull: {"comments.$.usersThatLiked": userId} }, (err, updatedTweet) => {
                if (err) return res.status(500).json({err: err.message});
                
                User.findOneAndUpdate({"tweets.comments._id": mongoose.Types.ObjectId(req.body.commentId)}, {$pull: {"tweets.$[tweet].comments.$[comment].usersThatLiked": userId}, $inc: {"tweets.$[tweet].comments.$[comment].likes": -1} }, {new: true, "arrayFilters": [{"tweet._id": tweetId}, {"comment._id": req.body.commentId} ]}, (err, updatedUser) => {
                    if (err) return res.status(500).json({error: err.message});

                    return res.status(200).json({updatedTweets: updatedUser.tweets.reverse()});
                })
            
            })
            break;
        
        default:
            res.status(400).json({error: "Bad request"});
            break;
    }

}


// search for tweets or users matching a particular string query
exports.tweet_search_index = (req, res) => {
    const userQuery = req.params.q;
    
    // searching through the tweets collection for a tweet whose 'tweetText' matches the passed query
    Tweet.find({ tweetText: { $regex: userQuery, $options: "i" } }, (err, matchingTweets) => {
        if (err) return res.status(500).json({error: err.message});
        
        // searching through the users collection for a user whose 'displayName' or 'username' matches the passed query
        User.find({ $or: [{displayName: { $regex: userQuery, $options: "i" }}, {username: { $regex: userQuery, $options: "i" }} ] }, {"messages": 0}, (err, matchingUsers) => {
            if (err) return res.status(500).json({error: err.message});

            return res.status(200).json({
                tweets: matchingTweets.reverse(),
                users: matchingUsers
            });

        });
    });

}

// get tweet trends
exports.get_tweet_trends = (req, res) => {
    const userId = req.params.id;

    User.findById({_id: userId}, async (err, foundUser) => {
        if (err) return res.status(500).json({error: err.message});

        // getting tags for a user based on the tweets and retweets of the user, tweets the user has liked and saved
        let tagsForUser = foundUser.tweets.map(tweet => tweet.tags ? tweet.tags : "")
        .concat(
            foundUser.retweets.map(tweet => tweet.tags ? tweet.tags : ""), 
            foundUser.likedTweets.map(tweet => tweet.tags ? tweet.tags : ""),
            foundUser.savedTweets.map(tweet => tweet.tags ? tweet.tags : "")
        )

        let tagsToCheckFor;

        // if the user has not tweeted, retweeted, saved or liked any tweet
        if (tagsForUser.length === 0){
            const allTweets = await Tweet.find({}).lean().exec();
            const tagsOfAllTweets = allTweets.map(tweet => tweet.tags ? tweet.tags : "").filter(tag => tag !== "").join(" ").split(" ");
            tagsToCheckFor = shuffleArray(tagsOfAllTweets);
        }else{
            tagsToCheckFor = tagsForUser.filter(tag => tag !== "").join(" ").split(" ");
        }

        // getting the most common tags
        const top_3_tags = get_top_occurences_in_array(tagsToCheckFor, 3);
        
        for (let [index_of_tag, tag] of top_3_tags.entries()){
            // getting tweets whose tags match the most common tags gotten for the user
            const matchingTweetsWithTag = await Tweet.find({tags: { $regex: tag.name, $options: "i"}}).exec();

            // updating the individual tag tweetCount
            top_3_tags[index_of_tag].tweetCount = matchingTweetsWithTag.length;
        }

        return res.status(200).json({trends: top_3_tags});

    })
}

// get a tweet trend
exports.get_tweet_trend = async (req, res) => {
    const trend = req.params.trend;
    const currentUser = await User.findById({_id: req.params.id}).exec();

    // workaround for getting tweets that have no tags
    if (trend === "@+)"){
        Tweet.find({ tags: { $eq: "" } }).sort( {_id: -1} ).exec( (err, matchingTweets) => {
            if (err) return res.status(500).json({error: err.message});
        
            return res.status(200).json({
                matchingTweets: matchingTweets.reverse(),
                userTweets: currentUser.tweets,
                userRetweets: currentUser.retweets,
                userLikedTweets: currentUser.likedTweets,
                userSavedTweets: currentUser.savedTweets
            });
        })
        return;
    }

    // getting tweets whose tags match the trend passed from the user
    Tweet.find({ tags: { $regex: trend, $options: "i" } }).sort( {_id: -1} ).exec( (err, matchingTweets) => {
        if (err) return res.status(500).json({error: err.message});
        
        return res.status(200).json({
            matchingTweets: matchingTweets.reverse(),
            userTweets: currentUser.tweets,
            userRetweets: currentUser.retweets,
            userLikedTweets: currentUser.likedTweets,
            userSavedTweets: currentUser.savedTweets
        });
    });
}
