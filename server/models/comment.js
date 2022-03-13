// requiring the neccessary packages from mongoose
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

// defining a new schema
const commentSchema = new Schema({
    author: String,
    authorImage: String,
    authorUsername: String,
    authorUserId: String,
    commentText: String,
    likes: {type: Number, default: 0},
    image: String,
    usersThatLiked: []
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
