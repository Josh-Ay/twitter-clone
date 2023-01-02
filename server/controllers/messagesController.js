// requiring the necessary models and packages
const Message = require("../models/message").Message;
const MessageContent = require("../models/messageContent").MessageContent;
const User = require("../models/user");
const awsS3Client = require("../middleware/upload/amazonS3Upload");
const fs = require("fs");

// get a user's messages
exports.get_user_messages = async (req, res) => {

    // querying for the user using the id passed as a parameter
    const foundUser = await User.findById({_id: req.params.userId});
    if (!foundUser) return res.status(404).json({error: "User not found"});

    const foundUserMessageItems = await Message.find({"owner": foundUser._id}).lean();
    
    let userMessages = await Promise.all(foundUserMessageItems.map(async (messageItem) => {
        const foundUserMessages = await MessageContent.find({ "refToMessageItem": messageItem._id }).sort({ "createdAt": 1 });
        const copyOfMessageItem = {...messageItem};
        copyOfMessageItem.messages = foundUserMessages;
        return copyOfMessageItem
    }))

    // returning the found user's messages sorted by the last time a message was sent('createdAt' field)
    return res.status(200).json({ userMessages: userMessages });
}

// post a new message
exports.post_new_message = async (req, res) => {

    // checking if there is an existing list of messages between both users(sender and receiver)
    const existingMessageListWithReceiver = await Message.findOne({"owner": req.params.senderUserId, "otherUserId": req.params.receiverUserId}).exec();
    
    // getting both profiles
    const sendingUser = await User.findById({_id: req.params.senderUserId}).exec();
    const receivingUser = await User.findById({_id: req.params.receiverUserId}).exec();

    // constructing a new message object
    const newMessageContent = {
        messageContent: req.body.messageContent,
        type: req.body.type,
        status: req.body.status,
        imageFile: ""
    }

    // if its the start of a new conversation
    if(!existingMessageListWithReceiver){
        // constructing a new message list for the sender using the 'Message' model
        const newMessageForSender = new Message({
            otherUserId: req.params.receiverUserId,
            username: receivingUser.username,
            displayName: receivingUser.displayName,
            socketId: receivingUser.socketId,
            profilePhoto: receivingUser.profilePhoto,
            owner: sendingUser._id,
        });
        
        // constructing a new message list for the receiver using the 'Message' model
        const newMessageForReceiver = new Message({
            otherUserId: req.params.senderUserId,
            username: sendingUser.username,
            displayName: sendingUser.displayName,
            socketId: sendingUser.socketId,
            profilePhoto: sendingUser.profilePhoto,
            owner: receivingUser._id,
        });

        // constructing new message contents using the 'MessageContent' model
        const newMessageContentForSender = new MessageContent({ ...newMessageContent, "refToMessageItem": newMessageForSender._id });
        const newMessageContentForReceiver = new MessageContent({ ...newMessageContent, "refToMessageItem": newMessageForReceiver._id });

        // creating a new message list for the sender
        await newMessageForSender.save();

        // creating a new message list for the receiver
        await newMessageForReceiver.save()
        
        // if there was file(an image) sent over
        if (req.file){
            const messageImage = req.file;

            // uploading the image to aws bucket
            await awsS3Client.uploadToAws(messageImage).then(async(awsRes) => {
                // deleting the file from the local server
                fs.unlink(messageImage.path, (err) => {
                    if (err) console.log("An error occured while trying to delete the file from the local server");
                    console.log("The file was deleted from local server successfully");
                });

                // updating the message content with the key gotten back from aws on successful upload
                newMessageContentForSender.messageImage = awsRes.Key;
                newMessageContentForReceiver.messageImage = awsRes.Key;
                
            }).catch(err => {
                return res.status(500).json({error: "An error occurred while trying to upload the message media to AWS"});
            })
        }
        
        // saving the message content for the sender
        await newMessageContentForSender.save();
                
        // changing the message content type for the receiver
        newMessageContentForReceiver.type = "received";

        // updating the status of the message content('0' for read, '1' for unread)
        newMessageContentForReceiver.status = "1";

        // saving the message content for the receiver
        await newMessageContentForReceiver.save();

        const foundUserMessageItem = await Message.findOne({"owner": sendingUser._id});
        if (!foundUserMessageItem) return res.status(404).json({error: "User has no messages yet"});
        
        const foundUserMessages = await MessageContent.find({ "refToMessageItem": foundUserMessageItem._id }, { $sort: { "createdAt": 1 }});

        // sending back the updated message details of the user(sender)
        return res.status(200).json({updatedUserMessages: foundUserMessages});
    
    // if its an existing conversation
    }else{

        const existingMessageListWithSender = await Message.findOne({"owner": req.params.receiverUserId, "otherUserId": req.params.senderUserId}).exec();

        // constructing new message contents using the 'MessageContent' model
        const newMessageContentForSender = new MessageContent({ ...newMessageContent, "refToMessageItem": existingMessageListWithReceiver._id });
        const newMessageContentForReceiver = new MessageContent({ ...newMessageContent, "refToMessageItem": existingMessageListWithSender._id });

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
                newMessageContentForSender.messageImage = awsRes.Key;
                newMessageContentForReceiver.messageImage = awsRes.Key;

            }).catch(err => {
                return res.status(500).json({error: "An error occurred while trying to upload the message media to AWS"});
            })

        }

        // saving the message content for the sender
        await newMessageContentForSender.save();
                
        // changing the message content type for the receiver
        newMessageContentForReceiver.type = "received";

        // updating the status of the message content('0' for read, '1' for unread)
        newMessageContentForReceiver.status = "1";

        // saving the message content for the receiver
        await newMessageContentForReceiver.save();

        const foundUserMessageItems = await Message.find({"owner": sendingUser._id}).lean();
    
        let userMessages = await Promise.all(foundUserMessageItems.map(async (messageItem) => {
            const foundUserMessages = await MessageContent.find({ "refToMessageItem": messageItem._id }).sort({ "createdAt": 1 });
            const copyOfMessageItem = {...messageItem};
            copyOfMessageItem.messages = foundUserMessages;
            return copyOfMessageItem
        }))

        // sending back the updated message details of the user(sender)
        return res.status(200).json({updatedUserMessages: userMessages});
    }
}

// update status of messages to read
exports.mark_all_messages_read = async (req, res) => {
    const existingMessageListWithSender = await Message.findOne({ "owner": req.params.receiverUserId, "otherUserId": req.params.senderUserId });

    // if there was no existing message list found between the receiver and the sender
    if(!existingMessageListWithSender) return res.status(200).json({updatedUserMessages: []});
    
    // updating all the unread messages(with a status of '1') in the receiver's messages list status from '1'(unread) to '0'(read)
    const allMessageContents = await MessageContent.find({ "refToMessageItem": existingMessageListWithSender._id });
    console.log(allMessageContents)
    await Promise.all(allMessageContents.map(async (content) => {
        console.log(content)
        if (content.type === "received") {
            content.status = "0";
            await content.save()
        }
    }))

    const foundUserMessageItems = await Message.find({"owner": req.params.receiverUserId}).lean();
    let userMessages = await Promise.all(foundUserMessageItems.map(async (messageItem) => {
        const foundUserMessages = await MessageContent.find({ "refToMessageItem": messageItem._id }).sort({ "createdAt": 1 });
        const copyOfMessageItem = {...messageItem};
        copyOfMessageItem.messages = foundUserMessages;
        return copyOfMessageItem
    }))

    // returning the updated user messages
    return res.status(200).json({updatedUserMessages: userMessages});

}