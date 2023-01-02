// requiring the neccessary package: mongoose, commentSchema
const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const commentSchema = require("../models/comment").commentSchema;

// defining a new schema
const tweetSchema = new Schema({
    author: String,
    authorImage: String,
    authorUsername: String,
    authorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    tweetText: String,
    tweetTextLowerCase: String,
    tweetScore: {type: Number, default: 0},
    liked : {type: Schema.Types.Boolean, default: false},
    retweeted: {type: Boolean, default: false},
    retweets: {type: Number, default: 0},
    retweetAuthor: {type: String, default: ""},
    image: String,
    saved: {type: Boolean, default: false},
    timesSaved: {type: Number, default: 0},
    visibility: String,
    tags: String,
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    tweetType: {
        enum: ["originalContent", "userCopy"],
        required: true,
        type: String,
    },
    originalTweetId: {
        type: String,
    }
},
{timestamps: true}
);


// creating a new model using the schema defined above
const Tweet = new model("Tweet", tweetSchema);

// exporting the tweet model and schema
module.exports = {
    tweetSchema,
    Tweet
}
