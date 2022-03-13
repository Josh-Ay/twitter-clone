// requiring the neccessary package: mongoose, messageContentSchema
const mongoose = require("mongoose");
const {Schema, model} = mongoose;
const messageContentSchema = require("./messageContent").messageContentSchema;

// defining the structure for the messages model
const messageSchema = new Schema({
    userId: String,
    socketId: String,
    username: String,
    displayName: String,
    profilePhoto: String,
    messages: [messageContentSchema],
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
