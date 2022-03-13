// requiring the necessary models and packages
const Message = require("../models/message").Message;
const MessageContent = require("../models/messageContent").MessageContent;
const User = require("../models/user");
const awsS3Client = require("../middleware/upload/amazonS3Upload");
const fs = require("fs");

// get a user's messages
exports.get_user_messages = (req, res) => {
    const userId = req.params.userId;

    // querying for the user using the id passed as a parameter
    User.findById({_id: userId}, (err, foundUser) => {
        if (err) return res.status(500).json({error: err.message});

        // returning the found user's messages and sorting by the last time a message was sent('updatedAt' field)
        return res.status(200).json({ userMessages: foundUser.messages.sort((a, b) => b.updatedAt - a.updatedAt) });
    })
}

// post a new message
exports.post_new_message = async (req, res) => {
    const senderUserId = req.params.senderUserId;
    const receiverUserId = req.params.receiverUserId;

    // checking if there is an existing list of messages between both users(sender and receiver)
    const existingMessageListWithReceiver = await User.findOne({_id: senderUserId, "messages.userId": receiverUserId}).exec();
    
    // getting both profiles
    const sendingUser = await User.findById({_id: senderUserId}).exec();
    const receivingUser = await User.findById({_id: receiverUserId}).exec();

    // constructing a new message using the 'MessageContent' model
    const newMessageContent = new MessageContent({
        messageContent: req.body.messageContent,
        type: req.body.type,
        status: req.body.status,
        imageFile: ""
    })

    // if its the start of a new conversation
    if(!existingMessageListWithReceiver){
        // constructing a new message list for the sender using the 'Message' model
        const newMessageForSender = new Message({
            userId: receiverUserId,
            username: receivingUser.username,
            displayName: receivingUser.displayName,
            socketId: receivingUser.socketId,
            profilePhoto: receivingUser.profilePhoto
        });
        
        // constructing a new message list for the receiver using the 'Message' model
        const newMessageForReceiver = new Message({
            userId: senderUserId,
            username: sendingUser.username,
            displayName: sendingUser.displayName,
            socketId: sendingUser.socketId,
            profilePhoto: sendingUser.profilePhoto
        });

        // creating a new message list for the sender
        User.findByIdAndUpdate({_id: senderUserId}, {$push: {"messages": newMessageForSender} }, (err, updatedUser) => {
            if (err) return res.status(500).json({error: err.message});
            
            // creating a new message list for the receiver
            User.findByIdAndUpdate({_id: receiverUserId}, {$push: {"messages": newMessageForReceiver} }, async (err, updatedUser) => {
                if (err) return res.status(500).json({error: err.message});
                
                // if there was file(an image) sent over
                if (req.file){
                    const messageImage = req.file;

                    // uploading the image to aws bucket
                    await awsS3Client.uploadToAws(messageImage).then(awsRes => {
                        // deleting the file from the local server
                        fs.unlink(messageImage.path, (err) => {
                            if (err) console.log("An error occured while trying to delete the file from the local server");
                            console.log("The file was deleted from local server successfully");
                        });

                        // updating the message content with the key gotten back from aws on successful upload
                        newMessageContent.messageImage = awsRes.Key;

                        // pushing the contents of message to the message list of the sender that has been created above
                        User.findOneAndUpdate({_id: senderUserId, "messages.userId": receiverUserId}, {$push: {"messages.$.messages": newMessageContent} }, {new: true}, (err, updatedUser) => {
                            if (err) return res.status(500).json({error: err.message});
                            
                            // changing the message content type for the receiver
                            newMessageContent.type = "received";

                            // pushing the contents of message to the message list of the receiver that has been created above
                            User.findOneAndUpdate({_id: receiverUserId, "messages.userId": senderUserId}, {$push: {"messages.$.messages": newMessageContent} }, (err, updatedReceiver) => {
                                if (err) return res.status(500).json({error: err.message});
                                
                                // sending back the updated message details of the user(sender)
                                return res.status(200).json({updatedUserMessages: updatedUser.messages.sort((a, b) => b.updatedAt - a.updatedAt)});
                            })
                        })


                    }).catch(err => {
                        return res.status(500).json({error: "An error occurred while trying to upload the message media to AWS"});
                    })
                }else{
                    // pushing the contents of message to the message list of the sender that has been created above
                    User.findOneAndUpdate({_id: senderUserId, "messages.userId": receiverUserId}, {$push: {"messages.$.messages": newMessageContent} }, {new: true}, (err, updatedUser) => {
                        if (err) return res.status(500).json({error: err.message});
                        
                        // changing the message content type for the receiver
                        newMessageContent.type = "received";

                        // pushing the contents of message to the message list of the receiver that has been created above
                        User.findOneAndUpdate({_id: receiverUserId, "messages.userId": senderUserId}, {$push: {"messages.$.messages": newMessageContent} }, (err, updatedReceiver) => {
                            if (err) return res.status(500).json({error: err.message});

                            // sending back the updated message details of the user(sender)
                            return res.status(200).json({updatedUserMessages: updatedUser.messages.sort((a, b) => b.updatedAt - a.updatedAt)});
                        })
                    })
                }
            })
        })
    
    // if its an existing conversation
    }else{

        // if there was file(an image) sent over
        if (req.file){
            const messageImage = req.file;

            // uploading the image to aws bucket
            await awsS3Client.uploadToAws(messageImage).then(awsRes => {
                // deleting the file from the local server
                fs.unlink(messageImage.path, (err) => {
                    if (err) console.log("An error occured while trying to delete the file from the local server");
                    console.log("The file was deleted from local server successfully");
                });

                // updating the message content with the key gotten back from aws on successful upload
                newMessageContent.messageImage = awsRes.Key;

                // pushing the contents of message to the message list of the sender
                User.findOneAndUpdate({_id: senderUserId, "messages.userId": receiverUserId}, {$push: {"messages.$.messages": newMessageContent} }, {new: true}, (err, updatedUser) => {
                    if (err) return res.status(500).json({error: err.message});
                    
                    // changing the message content type for the receiver    
                    newMessageContent.type = "received";

                    // pushing the contents of message to the message list of the receiver
                    User.findOneAndUpdate({_id: receiverUserId, "messages.userId": senderUserId}, {$push: {"messages.$.messages": newMessageContent} }, (err, updatedReceiver) => {
                        if (err) return res.status(500).json({error: err.message});
                        
                        // sending back the updated message details of the user(sender)
                        return res.status(200).json({updatedUserMessages: updatedUser.messages.sort((a, b) => b.updatedAt - a.updatedAt)});
                    })
                })


            }).catch(err => {
                return res.status(500).json({error: "An error occurred while trying to upload the message media to AWS"});
            })

        // no image sent
        }else{
            // pushing the contents of message to the message list of the sender
            User.findOneAndUpdate({_id: senderUserId, "messages.userId": receiverUserId}, {$push: {"messages.$.messages": newMessageContent} }, {new: true}, (err, updatedUser) => {
                if (err) return res.status(500).json({error: err.message});
            
                // changing the message content type for the receiver
                newMessageContent.type = "received";

                // pushing the contents of message to the message list of the receiver
                User.findOneAndUpdate({_id: receiverUserId, "messages.userId": senderUserId}, {$push: {"messages.$.messages": newMessageContent} }, (err, updatedReceiver) => {
                    if (err) return res.status(500).json({error: err.message});
            
                    // sending back the updated message details of the user(sender)
                    return res.status(200).json({updatedUserMessages: updatedUser.messages.sort((a, b) => b.updatedAt - a.updatedAt)});
                })
            })
        }
    }
}