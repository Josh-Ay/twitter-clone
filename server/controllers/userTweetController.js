// requiring the necessary packages and models
const mongoose = require("mongoose");
const User = require("../models/user");
const Tweet = require("../models/tweet").Tweet;
const Comment = require("../models/comment").Comment;
const awsS3Client = require("../middleware/upload/amazonS3Upload");
const fs = require("fs");
const { shuffleArray, get_top_occurences_in_array, get_unique_items_in_list_of_objects } = require("../helpers/helper");
const { CommentLike } = require("../models/commentsLike");

// create a new tweet for a user
exports.user_create_tweet_post = async (req, res) => {
    
    // if there was no image attached with the tweet
    if(!req.file){

        // creating a new document(tweet) using the 'Tweet' model
        const newTweet = new Tweet({
            author: req.body.author,
            authorImage: req.body.authorImage,
            authorUsername: req.body.authorUsername,
            authorId: req.params.id,
            tweetText: req.body.tweetText,
            tweetTextLowerCase: req.body.tweetText.toLocaleLowerCase(),
            visibility: req.body.visibility,
            tags: req.body.tags,
            owner: req.params.id,
            tweetType: "originalContent",
        });

        // saving the new tweet to the tweets collection('Tweet' model)
        newTweet.save((err, newTweetObj) => {
            if (err) return res.status(500).json({error: err.message});

            return res.status(200).json({newTweet: {...newTweetObj, comments: []}});
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
                authorId: req.params.id,
                tweetText: req.body.tweetText ? req.body.tweetText : "",
                image: awsRes.Key,
                visibility: req.body.visibility,
                tags: req.body.tags,
                owner: req.params.id,
                tweetType: "originalContent",
            });
            
            // saving the new tweet to the tweets collection('Tweet' model)
            newTweet.save((err, newTweetObj) => {
                if (err) return res.status(500).json({error: err.message});

                return res.status(200).json({newTweet: {...newTweetObj, comments: []}});
            });
    
        }).catch(err => {
            return res.status(500).json({error: "An error occurred while trying to upload the file."});
        });
    
    }
    
    
}

// get all tweets of a user's followers and following
exports.user_get_follow_tweet = (req, res) => {

    User.findById({_id: req.params.id}, async (err, user) => {
        if (err) return res.status(404).json({error: err.message});

        if(!user) return;

        let userTweets = await Tweet.aggregate([{
            $match: { "owner": user._id }
        },
        { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
        ]);

        userTweets = await Promise.all(userTweets.map(async (tweet) => {
            tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                const copyOfComment = {...comment}
                const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                copyOfComment.usersThatLiked = foundLikes;
                return copyOfComment
            }))
            return tweet
        }))

        // getting all the tweets and retweets of the current user, user's followers and following 
        if (user.followers.length === 0 && user.following.length === 0){
            let allTweets = await Tweet.aggregate([{
                $match: { "tweetType": "originalContent" }
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            { $sort: { "createdAt": -1 } },
            ]);
            
            allTweets = await Promise.all(allTweets.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))
            
            return res.status(200).json({
                userTweets: userTweets.filter(tweet => tweet.authorId.toString() === user._id.toString()),
                userRetweets: userTweets.filter(tweet => tweet.retweeted),
                userLikedTweets: userTweets.filter(tweet => tweet.liked),
                userSavedTweets: userTweets.filter(tweet => tweet.saved),
                tweets: get_unique_items_in_list_of_objects(userTweets.filter(tweet => tweet.authorId.toString() === user._id.toString()).concat(userTweets.filter(tweet => tweet.retweeted), allTweets), "_id"),
            })
        }

        const [followersTweets, followingTweets, followersRetweets, followingRetweets] = [[], [], [], []]
        user.followers.forEach(async (follower) => {
            let userTweets = await Tweet.aggregate([{
                $match: { "owner": mongoose.Types.ObjectId(follower) }
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            ]);
            userTweets = await Promise.all(userTweets.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))

            followersTweets.push(userTweets.filter(tweet => tweet.authorId.toString() === follower))
            followersRetweets.push(userTweets.filter(tweet => tweet.retweeted))
        })
        user.following.forEach(async (following) => {
            let userTweets = await Tweet.aggregate([{
                $match: { "owner": mongoose.Types.ObjectId(following) }
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            ]);
            userTweets = await Promise.all(userTweets.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))

            followingTweets.push(userTweets.filter(tweet => tweet.authorId.toString() === following))
            followingRetweets.push(userTweets.filter(tweet => tweet.retweeted))
        })

        // sending the tweets and retweets back as response
        return res.status(200).json({
            userTweets: userTweets.filter(tweet => tweet.authorId.toString() === user._id.toString()),
            userRetweets: userTweets.filter(tweet => tweet.retweeted),
            userLikedTweets: userTweets.filter(tweet => tweet.liked),
            userSavedTweets: userTweets.filter(tweet => tweet.saved),
            tweets: get_unique_items_in_list_of_objects(
                userTweets.filter(tweet => tweet.tweetType === "originalContent").filter(tweet => tweet.authorId.toString() === user._id.toString()).concat( 
                userTweets.filter(tweet => tweet.retweeted),
                followersTweets.flat(),
                followingTweets.flat(),
                followersRetweets.flat(), 
                followersRetweets.flat(),
                ).flat(), "_id"
            ).reverse()
        });
    })
}


// get all tweets of a user
exports.get_user_tweet_index = async (req, res) => {
    const currentUserProfile = await User.findById({_id: req.params.id}).exec();
    
    if (!currentUserProfile) return res.status(404).json({error: "Current user profile does not exist"});

    let userTweets = await Tweet.aggregate([{
        $match: { "owner": mongoose.Types.ObjectId(req.params.id) }
    },
    { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
    ]);
    userTweets = await Promise.all(userTweets.map(async (tweet) => {
        tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
            const copyOfComment = {...comment}
            const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
            copyOfComment.usersThatLiked = foundLikes;
            return copyOfComment
        }))
        return tweet
    }))

    switch (req.params.type) {
        // getting the tweets of a user
        case "tweets":
            res.status(200).json({
                tweets: userTweets.filter(tweet => tweet.tweetType === "originalContent").reverse(),
                userTweets: userTweets.filter(tweet => tweet.authorId.toString() === currentUserProfile._id.toString()),
                userRetweets: userTweets.filter(tweet => tweet.retweeted),
                userLikedTweets: userTweets.filter(tweet => tweet.liked),
                userSavedTweets: userTweets.filter(tweet => tweet.saved)
            });
            break;
        
        // getting the tweets, retweets of the user and the tweets where the user has commented
        case "tweets+replies":
            const matchingTweets = userTweets.filter(tweet => tweet.comments.length > 1);
            return res.status(200).json({
                tweets: userTweets.filter(tweet => tweet.authorId.toString() === currentUserProfile._id.toString()).concat(userTweets.filter(tweet => tweet.retweeted), matchingTweets).reverse(),
                userTweets: userTweets.filter(tweet => tweet.authorId.toString() === currentUserProfile._id.toString()),
                userRetweets: userTweets.filter(tweet => tweet.retweeted),
                userLikedTweets: userTweets.filter(tweet => tweet.liked),
                userSavedTweets: userTweets.filter(tweet => tweet.saved)
            });
            break;

        // getting the tweets of the current user that have images
        case "media":
            let matchingTweetsWithMedia = await Tweet.aggregate([{
                $match: { $and: [{"owner": mongoose.Types.ObjectId(req.params.id) }, {"image": {$exists: true, $ne: ""}}, {"authorUsername": currentUserProfile.username} ]}
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            { $sort: { "createdAt": -1 } },
            ]);
            
            matchingTweetsWithMedia = await Promise.all(matchingTweetsWithMedia.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))

            return res.status(200).json({
                tweets: matchingTweetsWithMedia,
                userTweets: userTweets.filter(tweet => tweet.authorId.toString() === currentUserProfile._id.toString()),
                userRetweets: userTweets.filter(tweet => tweet.retweeted),
                userLikedTweets: userTweets.filter(tweet => tweet.liked),
                userSavedTweets: userTweets.filter(tweet => tweet.saved)
            });
            break;
        
        // getting the tweets that the user has liked 
        case "likes":
            res.status(200).json({
                tweets: userTweets.filter(tweet => tweet.liked),
                userTweets: userTweets.filter(tweet => tweet.authorId.toString() === currentUserProfile._id.toString()),
                userRetweets: userTweets.filter(tweet => tweet.retweeted),
                userLikedTweets: userTweets.filter(tweet => tweet.liked),
                userSavedTweets: userTweets.filter(tweet => tweet.saved)
            });
            break;
        default:
            res.status(400).json({error: "Bad request"});
            break;
    }
}

// get a specific category of tweets for a user
exports.tweet_index = async (req, res) => {
    let userTweets = await Tweet.aggregate([{
        $match: { "owner": mongoose.Types.ObjectId(req.params.id) }
    },
    { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
    ]);

    userTweets = await Promise.all(userTweets.map(async (tweet) => {
        tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
            const copyOfComment = {...comment}
            const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
            copyOfComment.usersThatLiked = foundLikes;
            return copyOfComment
        }))
        return tweet
    }))

    const savedTweets = userTweets.map(tweet => {
        if (tweet.tweetType === "userCopy" && tweet.saved) {
            const foundOriginalTweet = userTweets.find(t => t._id.toString() === tweet.originalTweetId);
            if (foundOriginalTweet) return foundOriginalTweet
            return {}
        }
        return {}
    }).filter(tweet => tweet._id)

    // bookmarks
    if (req.params.type === "bookmarks"){
        switch (req.params.category) {
            // getting the saved tweets of a user
            case "tweets":
                res.status(200).json({
                    tweets: savedTweets.reverse(),
                    userTweets: userTweets.filter(tweet => tweet.authorId.toString() === req.params.id),
                    userRetweets: userTweets.filter(tweet => tweet.retweeted),
                    userLikedTweets: userTweets.filter(tweet => tweet.liked),
                    userSavedTweets: userTweets.filter(tweet => tweet.saved)
                })
                break;
            
            // getting the saved tweets of a user that have comments
            case "tweets+replies":
                res.status(200).json({
                    tweets: savedTweets.filter(tweet => tweet.authorId.toString() === req.params.id).filter(tweet => tweet.comments.length > 1).reverse(),
                    userTweets: userTweets.filter(tweet => tweet.authorId.toString() === req.params.id),
                    userRetweets: userTweets.filter(tweet => tweet.retweeted),
                    userLikedTweets: userTweets.filter(tweet => tweet.liked),
                    userSavedTweets: userTweets.filter(tweet => tweet.saved)
                });
                
                break;
            
            // getting the saved tweets of a user that have an image
            case "media":
                res.status(200).json({
                    tweets: savedTweets.filter(tweet => tweet.image).reverse(),
                    userTweets: userTweets.filter(tweet => tweet.authorId.toString() === req.params.id),
                    userRetweets: userTweets.filter(tweet => tweet.retweeted),
                    userLikedTweets: userTweets.filter(tweet => tweet.liked),
                    userSavedTweets: userTweets.filter(tweet => tweet.saved)
                });

                break;
            
            // getting the saved tweets of a user that was liked by the user
            case "likes":
                res.status(200).json({
                    tweets: savedTweets.filter(tweet => tweet.liked),
                    userTweets: userTweets.filter(tweet => tweet.authorId.toString() === req.params.id),
                    userRetweets: userTweets.filter(tweet => tweet.retweeted),
                    userLikedTweets: userTweets.filter(tweet => tweet.liked),
                    userSavedTweets: userTweets.filter(tweet => tweet.saved)
                });
                break;
            default:
                res.status(400).json({error: "Bad request"});
                break;
        }

        // explore 
    } else if (req.params.type === "explore"){
        
        let allTweets = await Tweet.aggregate([{
            $match: { "tweetType": "originalContent" }
        },
        { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
        { $sort: { "createdAt": -1 } },
        ]);

        allTweets = await Promise.all(allTweets.map(async (tweet) => {
            tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                const copyOfComment = {...comment}
                const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                copyOfComment.usersThatLiked = foundLikes;
                return copyOfComment
            }))
            return tweet
        }))
        
        let currentUserTweets = await Tweet.aggregate([{
            $match: { "owner": mongoose.Types.ObjectId(req.params.id) }
        },
        { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
        ]);

        currentUserTweets = await Promise.all(currentUserTweets.map(async (tweet) => {
            tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                const copyOfComment = {...comment}
                const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                copyOfComment.usersThatLiked = foundLikes;
                return copyOfComment
            }))
            return tweet
        }))

        switch (req.params.category) {
            // getting the top tweets for a user sorted by a 'tweetScore'
            case "top":
                res.status(200).json({
                    tweets: allTweets.sort((a, b) => b.tweetScore - a.tweetScore),
                    userTweets: currentUserTweets.filter(tweet => tweet.authorId.toString() === req.params.id),
                    userRetweets: currentUserTweets.filter(tweet => tweet.retweeted),
                    userLikedTweets: currentUserTweets.filter(tweet => tweet.liked),
                    userSavedTweets: currentUserTweets.filter(tweet => tweet.saved)
                });
                break;

            // getting the latest tweets for a user
            case "latest":
                res.status(200).json({
                    tweets: allTweets,
                    userTweets: currentUserTweets.filter(tweet => tweet.authorId.toString() === req.params.id),
                    userRetweets: currentUserTweets.filter(tweet => tweet.retweeted),
                    userLikedTweets: currentUserTweets.filter(tweet => tweet.liked),
                    userSavedTweets: currentUserTweets.filter(tweet => tweet.saved)
                })
                break;
            
            // getting other's users
            case "people":
                const allUsers = await User.find({}).limit(10).lean().exec();
                
                res.status(200).json({users: allUsers.sort((a, b) => b.followers - a.followers)});
                break;
            
            // getting tweets that have an image
            case "media":
                res.status(200).json({
                    tweets: allTweets.filter(tweet => tweet.image),
                    userTweets: currentUserTweets.filter(tweet => tweet.authorId.toString() === req.params.id),
                    userRetweets: currentUserTweets.filter(tweet => tweet.retweeted),
                    userLikedTweets: currentUserTweets.filter(tweet => tweet.liked),
                    userSavedTweets: currentUserTweets.filter(tweet => tweet.saved)
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
exports.user_update_tweet = async (req, res) => {
    
    if (!req.body.action) return res.status(500).json({message: "request missing 'typeOfAction' parameter in body"});
    
    const currentUser = await User.findById({_id: req.params.id});
    if (!currentUser) return res.status(404).json({error: "User not found"});

    let userTweets = await Tweet.aggregate([{
        $match: { "owner": mongoose.Types.ObjectId(currentUser._id) }
    },
    { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
    ]);
    userTweets = await Promise.all(userTweets.map(async (tweet) => {
        tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
            const copyOfComment = {...comment}
            const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
            copyOfComment.usersThatLiked = foundLikes;
            return copyOfComment
        }))
        return tweet
    }))

    const [followersTweets, followingTweets, followersRetweets, followingRetweets] = [[], [], [], []]
    currentUser.followers.forEach(async (follower) => {
        let userTweets = await Tweet.aggregate([{
            $match: { "owner": mongoose.Types.ObjectId(follower) }
        },
        { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
        ]);
        userTweets = await Promise.all(userTweets.map(async (tweet) => {
            tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                const copyOfComment = {...comment}
                const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                copyOfComment.usersThatLiked = foundLikes;
                return copyOfComment
            }))
            return tweet
        }))

        followersTweets.push(userTweets.filter(tweet => tweet.authorId.toString() === follower))
        followersRetweets.push(userTweets.filter(tweet => tweet.retweeted))
    })
    currentUser.following.forEach(async (following) => {
        let userTweets = await Tweet.aggregate([{
            $match: { "owner": mongoose.Types.ObjectId(following) }
        },
        { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
        ]);
        userTweets = await Promise.all(userTweets.map(async (tweet) => {
            tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                const copyOfComment = {...comment}
                const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                copyOfComment.usersThatLiked = foundLikes;
                return copyOfComment
            }))
            return tweet
        }))

        followingTweets.push(userTweets.filter(tweet => tweet.authorId.toString() === following))
        followingRetweets.push(userTweets.filter(tweet => tweet.retweeted))
    })
    let tweetToUpdate = null;
    let userCopyOfTweet = null;

    switch (req.body.action) {
        // if the type of action inititiated by the user was to add a new comment
        case "comment":
            // finding the tweet to be updated
            const foundTweet = await Tweet.findById({_id: req.params.tweetId, tweetType: "originalContent"});
            
            // creating a new comment document using the 'Comment' model
            const newCommentObj = {
                author: req.body.author,
                authorImage: req.body.authorImage,
                authorUsername: req.body.authorUsername,
                authorUserId: req.body.authorUserId,
                commentText: req.body.commentText,
                image: "",
                tweetId: foundTweet._id,
            }
            const newComment = new Comment(newCommentObj);

            let currentTweetIndex = userTweets.findIndex(tweet => tweet._id.toString() === foundTweet._id.toString());
            let updatedTweetWithNewComment = null;
            if (currentTweetIndex !== -1) updatedTweetWithNewComment = userTweets[currentTweetIndex];

            // if there was no image attached to the comment
            if (!req.file){
                await newComment.save();

                if (updatedTweetWithNewComment) {
                    updatedTweetWithNewComment.comments.push({ ...newCommentObj, "_id": newComment._id, "createdAt": newComment.createdAt, "updatedAt": newComment.updatedAt, "likes": 0, "usersThatLiked": [] });
                    userTweets[currentTweetIndex] = updatedTweetWithNewComment;
                }

                return res.status(200).json({updatedTweets: 
                    get_unique_items_in_list_of_objects(
                        userTweets.filter(tweet => tweet.tweetType === "originalContent").filter(tweet => tweet.authorId.toString() === req.params.id).concat(
                            userTweets.filter(tweet => tweet.retweeted), 
                            followersTweets.flat(), 
                            followingTweets.flat(), 
                            followersRetweets.flat(), 
                            followingRetweets.flat(),
                        ).flat(), "_id"
                    ).reverse()
                })
            }

            // if there was image attached to the comment
            await awsS3Client.uploadToAws(req.file).then(async(awsRes) => {
                // deleting the file from the local server
                fs.unlink(tweetImageFile.path, (err) => {
                    if (err) console.log("An error occured while trying to delete the file from the local server");
                    console.log("The file was deleted from local server successfully");
                });

                // updating the comment document created above to add the key(of the image attached) gotten back from aws
                newComment.image = awsRes.Key;

                await newComment.save();

                if (updatedTweetWithNewComment) {
                    updatedTweetWithNewComment.comments.push({ ...newCommentObj, "image": awsRes.Key, "_id": newComment._id, "createdAt": newComment.createdAt, "updatedAt": newComment.updatedAt, "likes": 0, "usersThatLiked": [] });
                    userTweets[currentTweetIndex] = updatedTweetWithNewComment;
                }

                return res.status(200).json({updatedTweets: 
                    get_unique_items_in_list_of_objects(
                        userTweets.filter(tweet => tweet.authorId.toString() === req.params.id).concat(
                            userTweets.filter(tweet => tweet.retweeted), 
                            followersTweets.flat(), 
                            followingTweets.flat(), 
                            followersRetweets.flat(), 
                            followingRetweets.flat(),
                        ).flat(), "_id"
                    ).reverse()
                })
        
            }).catch(err => {
                return res.status(500).json({error: "An error occurred while trying to upload the file."});
            });
            break;
        
        // if the type of action inititiated by the user was to like a tweet
        case "like":
            // finding the tweet to be updated
            tweetToUpdate = await Tweet.findById({ _id: req.params.tweetId, tweetType: "originalContent" })
            if (!tweetToUpdate) return res.status(404).json({error: "Original tweet not found"});
            
            userCopyOfTweet = await Tweet.findOne({ owner: req.params.id, tweetType: "userCopy", originalTweetId: req.params.tweetId })
            
            if (userCopyOfTweet) {
                userCopyOfTweet.liked = true;
                await userCopyOfTweet.save();
            }

            if (!userCopyOfTweet) {
                const newUserCopyOfTweet = new Tweet({
                    author: tweetToUpdate.author,
                    authorImage: tweetToUpdate.authorImage,
                    authorUsername: tweetToUpdate.authorUsername,
                    authorId: tweetToUpdate.authorId,
                    tweetText: tweetToUpdate.tweetText,
                    image: tweetToUpdate.image,
                    visibility: tweetToUpdate.visibility,
                    tags: tweetToUpdate.tags,
                    owner: req.params.id,
                    liked: true,
                    tweetType: "userCopy",
                    originalTweetId: tweetToUpdate._id.toString(),
                })
    
                await newUserCopyOfTweet.save();
            }

            let userLikedTweets = await Tweet.aggregate([{
                $match: {$and: [{ "owner": mongoose.Types.ObjectId(req.params.id) }, { "tweetType": "userCopy" }, { "liked": true }]}
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            { $sort: { 'createdAt': -1 }}
            ]);
            userLikedTweets = await Promise.all(userLikedTweets.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))

            res.status(200).json({updatedLikedTweets: userLikedTweets});

            break;

        // if the type of action inititiated by the user was to unlike a tweet
        case "unlike":
            // finding the tweet to be updated
            const existingUserCopyOfTweet = await Tweet.findOne({ owner: req.params.id, tweetType: "userCopy", originalTweetId: req.params.tweetId, liked: true })
            if (!existingUserCopyOfTweet) return res.status(404).json({error: "Liked tweet not found"});
            
            existingUserCopyOfTweet.liked = false;
            await existingUserCopyOfTweet.save();

            let updatedLikedTweets = await Tweet.aggregate([{
                $match: {$and: [{ "owner": mongoose.Types.ObjectId(req.params.id) }, { "tweetType": "userCopy" }, { "liked": true }]}
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            { $sort: { 'createdAt': -1 }}
            ]);
            updatedLikedTweets = await Promise.all(updatedLikedTweets.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))

            res.status(200).json({updatedLikedTweets: updatedLikedTweets});
            break;

        // if the type of action inititiated by the user was to save a tweet
        case "save":
            // finding the tweet to be updated
            tweetToUpdate = await Tweet.findById({ _id: req.params.tweetId, tweetType: "originalContent" })
            if (!tweetToUpdate) return res.status(404).json({error: "Original tweet not found"});
            
            userCopyOfTweet = await Tweet.findOne({ owner: req.params.id, tweetType: "userCopy", originalTweetId: req.params.tweetId });
            
            if (userCopyOfTweet) {
                userCopyOfTweet.saved = true;
                await userCopyOfTweet.save();
            }

            if (!userCopyOfTweet) {
                const newUserCopyOfTweet = new Tweet({
                    author: tweetToUpdate.author,
                    authorImage: tweetToUpdate.authorImage,
                    authorUsername: tweetToUpdate.authorUsername,
                    authorId: tweetToUpdate.authorId,
                    tweetText: tweetToUpdate.tweetText,
                    image: tweetToUpdate.image,
                    visibility: tweetToUpdate.visibility,
                    tags: tweetToUpdate.tags,
                    owner: req.params.id,
                    saved: true,
                    tweetType: "userCopy",
                    originalTweetId: tweetToUpdate._id.toString(),
                })
    
                await newUserCopyOfTweet.save();
            }

            tweetToUpdate.timesSaved += 1;
            await tweetToUpdate.save();

            let updatedSavedTweets = await Tweet.aggregate([{
                $match: {$and: [{ "owner": mongoose.Types.ObjectId(req.params.id) }, { "tweetType": "userCopy" }, { "saved": true }]}
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            { $sort: { 'createdAt': -1 }}
            ]);
            updatedSavedTweets = await Promise.all(updatedSavedTweets.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))

            res.status(200).json({updatedSavedTweets: updatedSavedTweets});
            
            break;
        
        // if the type of action inititiated by the user was to unsave a tweet
        case "unsave":
            // finding the tweet to be updated
            const existingSavedUserCopyOfTweet = await Tweet.findOne({ owner: req.params.id, tweetType: "userCopy", originalTweetId: req.params.tweetId, saved: true })
            if (!existingSavedUserCopyOfTweet) return res.status(404).json({error: "Saved tweet not found"});
            
            // finding the existing tweet
            tweetToUpdate = await Tweet.findById({ _id: req.params.tweetId, tweetType: "originalContent" })
            if (!tweetToUpdate) return res.status(404).json({error: "Original tweet not found"});

            existingSavedUserCopyOfTweet.saved = false;
            await existingSavedUserCopyOfTweet.save();

            tweetToUpdate.timesSaved -= 1;
            await tweetToUpdate.save();

            let updatedUserSavedTweets = await Tweet.aggregate([{
                $match: {$and: [{ "owner": mongoose.Types.ObjectId(req.params.id) }, { "tweetType": "userCopy" }, { "saved": true }]}
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            { $sort: { 'createdAt': -1 }}
            ]);
            updatedUserSavedTweets = await Promise.all(updatedUserSavedTweets.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))

            res.status(200).json({updatedSavedTweets: updatedUserSavedTweets});
            break;
        
        // if the type of action inititiated by the user was to retweet a tweet
        case "retweet":
            // finding the tweet to be updated
            tweetToUpdate = await Tweet.findById({ _id: req.params.tweetId, tweetType: "originalContent" })
            if (!tweetToUpdate) return res.status(404).json({error: "Original tweet not found"});
            
            userCopyOfTweet = await Tweet.findOne({ owner: req.params.id, tweetType: "userCopy", originalTweetId: req.params.tweetId })
            
            if (userCopyOfTweet) {
                userCopyOfTweet.retweeted = true;
                await userCopyOfTweet.save();
            }

            if (!userCopyOfTweet) {
                const newUserCopyOfTweet = new Tweet({
                    author: tweetToUpdate.author,
                    authorImage: tweetToUpdate.authorImage,
                    authorUsername: tweetToUpdate.authorUsername,
                    authorId: tweetToUpdate.authorId,
                    tweetText: tweetToUpdate.tweetText,
                    image: tweetToUpdate.image,
                    visibility: tweetToUpdate.visibility,
                    tags: tweetToUpdate.tags,
                    owner: req.params.id,
                    retweeted: true,
                    tweetType: "userCopy",
                    originalTweetId: tweetToUpdate._id.toString(),
                })
    
                await newUserCopyOfTweet.save();
            }

            tweetToUpdate.retweets += 1;
            await tweetToUpdate.save();

            let updatedRetweets = await Tweet.aggregate([{
                $match: {$and: [{ "owner": mongoose.Types.ObjectId(req.params.id) }, { "tweetType": "userCopy" }, { "retweeted": true }]}
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            { $sort: { 'createdAt': -1 }}
            ]);
            updatedRetweets = await Promise.all(updatedRetweets.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))

            res.status(200).json({updatedRetweets: updatedRetweets});
            break;

        // if the type of action inititiated by the user was to un-retweet a tweet
        case "unretweet":
            // finding the tweet to be updated
            const existingRetweetedUserCopyOfTweet = await Tweet.findOne({ owner: req.params.id, tweetType: "userCopy", originalTweetId: req.params.tweetId, retweeted: true })
            if (!existingRetweetedUserCopyOfTweet) return res.status(404).json({error: "Retweeted tweet not found"});
            
            // finding the existing tweet
            tweetToUpdate = await Tweet.findById({ _id: req.params.tweetId, tweetType: "originalContent" })
            if (!tweetToUpdate) return res.status(404).json({error: "Original tweet not found"});

            existingRetweetedUserCopyOfTweet.retweeted = false;
            await existingRetweetedUserCopyOfTweet.save();

            tweetToUpdate.retweets -= 1;
            await tweetToUpdate.save();

            let updatedUserRetweetedTweets = await Tweet.aggregate([{
                $match: {$and: [{ "owner": mongoose.Types.ObjectId(req.params.id) }, { "tweetType": "userCopy" }, { "retweeted": true }]}
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            { $sort: { 'createdAt': -1 }}
            ]);
            updatedUserRetweetedTweets = await Promise.all(updatedUserRetweetedTweets.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))

            res.status(200).json({updatedRetweets: updatedUserRetweetedTweets});
            break;
        
        // if the type of action inititiated by the user was to like a comment
        case "like-comment":
            // finding the comment to be updated
            const existingComment = await Comment.findById({_id: req.body.commentId});
            if (!existingComment) return res.status(404).json({error: "Comment not found"});

            existingComment.likes +=1;
            const newCommentLike = new CommentLike({
                commentId: req.body.commentId,
                userId: req.params.id,
            })
            
            await existingComment.save();
            await newCommentLike.save();

            let updatedTweets = await Tweet.aggregate([{
                $match: {$and: [{ "owner": mongoose.Types.ObjectId(req.params.id) }, { "tweetType": "originalContent" }]}
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            { $sort: { 'createdAt': -1 }}
            ]);
        
            updatedTweets = await Promise.all(updatedTweets.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))

            res.status(200).json({updatedTweets: updatedTweets});
            
            break;
        
        // if the type of action inititiated by the user was to un-like a comment
        case "unlike-comment":
            // finding the comment to be updated
            const foundComment = await Comment.findById({_id: req.body.commentId});
            if (!foundComment) return res.status(404).json({error: "Comment not found"});

            // finding the comment like to be updated
            const foundCommentLike = await CommentLike.findOne({commentId: req.body.commentId, userId: req.params.id});
            if (!foundCommentLike) return res.status(404).json({error: "Comment like not found"});

            foundComment.likes -=1;
            
            await foundComment.save();
            await foundCommentLike.delete();

            let updatedTweetsForUser = await Tweet.aggregate([{
                $match: {$and: [{ "owner": mongoose.Types.ObjectId(req.params.id) }, { "tweetType": "originalContent" }]}
            },
            { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
            { $sort: { 'createdAt': -1 }}
            ]);
            updatedTweetsForUser = await Promise.all(updatedTweetsForUser.map(async (tweet) => {
                tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                    const copyOfComment = {...comment}
                    const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                    copyOfComment.usersThatLiked = foundLikes;
                    return copyOfComment
                }))
                return tweet
            }))

            res.status(200).json({updatedTweets: updatedTweetsForUser});
            
            break;
        
        default:
            res.status(400).json({error: "Bad request"});
            break;
    }

}


// search for tweets or users matching a particular string query
exports.tweet_search_index = async (req, res) => {
    
    // searching through the tweets collection for a tweet whose 'tweetText' matches the passed query
    const matchingTweets = await Tweet.find({ tweetText: { $regex: req.params.q, $options: "i" }, tweetType: "originalContent" }).lean();
    
    let tweetsToSendBack = await Promise.all(matchingTweets.map(async (tweet) => {
        const copyOfTweet = { ...tweet };
        const commentsForTweet = await Comment.find({ "tweetId": tweet._id }).lean();
        copyOfTweet.comments = await Promise.all(commentsForTweet.map(async(comment) => {
            const copyOfComment = {...comment}
            const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
            copyOfComment.usersThatLiked = foundLikes;
            return copyOfComment
        }))
        return copyOfTweet
    }))

    // searching through the users collection for a user whose 'displayName' or 'username' matches the passed query
    const matchingUsers = await User.find({ $or: [{displayName: { $regex: req.params.q, $options: "i" }}, {username: { $regex: req.params.q, $options: "i" }} ] })
    
    return res.status(200).json({
        tweets: tweetsToSendBack.reverse(),
        users: matchingUsers
    });
}

// get tweet trends
exports.get_tweet_trends = (req, res) => {
    
    User.findById({_id: req.params.id}, async (err, foundUser) => {
        if (err) return res.status(500).json({error: err.message});

        let userTweets = await Tweet.aggregate([{
            $match: {$and: [{ "owner": mongoose.Types.ObjectId(foundUser._id) }, { "tweetType": "originalContent" }]}
        },
        { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
        ]);
        userTweets = await Promise.all(userTweets.map(async (tweet) => {
            tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
                const copyOfComment = {...comment}
                const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
                copyOfComment.usersThatLiked = foundLikes;
                return copyOfComment
            }))
            return tweet
        }))

        // getting tags for a user based on the tweets and retweets of the user, tweets the user has liked and saved
        let tagsForUser = userTweets.filter(tweet => tweet.authorId.toString() === foundUser._id.toString()).map(tweet => tweet.tags ? tweet.tags : "")
        .concat(
            userTweets.filter(tweet => tweet.retweeted).map(tweet => tweet.tags ? tweet.tags : ""), 
            userTweets.filter(tweet => tweet.liked).map(tweet => tweet.tags ? tweet.tags : ""),
            userTweets.filter(tweet => tweet.saved).map(tweet => tweet.tags ? tweet.tags : "")
        )

        let tagsToCheckFor;

        // if the user has not tweeted, retweeted, saved or liked any tweet
        if (tagsForUser.length === 0){
            const allTweets = await Tweet.find({ tweetType: "originalContent" }).lean().exec();
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
    let userTweets = await Tweet.aggregate([{
        $match: { "owner": mongoose.Types.ObjectId(req.params.id) }
    },
    { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
    {$sort: {"createdAt": -1} }
    ]);
    userTweets = await Promise.all(userTweets.map(async (tweet) => {
        tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
            const copyOfComment = {...comment}
            const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
            copyOfComment.usersThatLiked = foundLikes;
            return copyOfComment
        }))
        return tweet
    }))

    // getting tweets whose tags match the trend passed from the user
    let matchingTweets = await Tweet.aggregate([{
        $match: {$and: [{ tags: { $regex: req.params.trend, $options: "i" } }, { "tweetType": "originalContent" }]}
    },
    { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
    { $sort: { "createdAt": -1 }}
    ])

    // workaround for getting tweets that have no tags
    if (req.params.trend === "@+)"){
        matchingTweets = await Tweet.aggregate([{
            $match: {$and: [{ tags: { $eq: "" } }, { "tweetType": "originalContent" }]}
        },
        { $lookup: { from: "comments", localField: "_id", foreignField: "tweetId", as: "comments", } },
        { $sort: { "createdAt": -1 }}
        ])
    }

    matchingTweets = await Promise.all(matchingTweets.map(async (tweet) => {
        tweet.comments = await Promise.all(tweet.comments.map(async(comment) => {
            const copyOfComment = {...comment}
            const foundLikes = await CommentLike.find({"commentId": comment._id.toString()});
            copyOfComment.usersThatLiked = foundLikes;
            return copyOfComment
        }))
        return tweet
    }))

    return res.status(200).json({
        matchingTweets: matchingTweets,
        userTweets: userTweets.filter(tweet => tweet.authorId.toString() === req.params.id),
        userRetweets: userTweets.filter(tweet => tweet.retweeted),
        userLikedTweets: userTweets.filter(tweet => tweet.liked),
        userSavedTweets: userTweets.filter(tweet => tweet.saved)
    });
}
