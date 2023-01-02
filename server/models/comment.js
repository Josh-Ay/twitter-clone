// requiring the neccessary packages from mongoose
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

// defining a new schema
const commentSchema = new Schema({
    author: String,
    authorImage: String,
    authorUsername: String,
    authorUserId: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    commentText: String,
    likes: {type: Number, default: 0},
    image: String,
    tweetId: {
        type: Schema.Types.ObjectId,
        ref: "Tweet",
    }
},
{timestamps: true}
);

// creating a new model using the schema defined above
const Comment = new model("Comment", commentSchema);

// exporting the comment schema and model
module.exports = {
    commentSchema,
    Comment
};
