// requiring the neccessary package: mongoose, messageContentSchema
const mongoose = require("mongoose");
const {Schema, model} = mongoose;

// defining the structure for the messages model
const messageSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    otherUserId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    socketId: String,
    username: String,
    displayName: String,
    profilePhoto: String,
},
{timestamps: true},
)

// creating a new model using the schema created above
const Message = new model("message", messageSchema);

// exporting the model and schema
module.exports = {
    Message,
    messageSchema
};
