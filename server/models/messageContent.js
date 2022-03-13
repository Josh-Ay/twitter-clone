// requiring the neccessary package: mongoose
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

// defining the structure for the messageContent model
const messageContentSchema = new Schema({
    messageContent: String,
    messageImage: String, 
    type: String,
    status: String || Boolean,
    encrypted: {default: true, type: Boolean},
},
    {timestamps: true}
);

// creating a new model using the schema created above
const MessageContent = new model("messageContent", messageContentSchema);

// exporting the model and schema
module.exports = {
    MessageContent,
    messageContentSchema
};
