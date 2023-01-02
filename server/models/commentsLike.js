const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const commentsLikeSchema = new Schema({
    commentId: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
    }
})

const CommentLike = new model("comment-likes", commentsLikeSchema);

module.exports = {
    CommentLike,
    commentsLikeSchema,
}