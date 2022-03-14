import ArrowBackIosNewIcon from '@material-ui/icons/ArrowBackIosNew';
import InfoIcon from '@material-ui/icons/Info';
import Panorama from "@material-ui/icons/Panorama";
import MenuIcon from '@material-ui/icons/Menu';
import Send from "@material-ui/icons/Send";
import React, { useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { checkImageFile } from '../validators/Validators';
import { Formatter } from '../helpers/Formatter';
import useScrollToBottom from '../hooks/useScrollToBottom';


const ChatRoom = ({currentUserDetailsRef, currentActiveUserChat, handleBackIconClick, messages, newMessage, createMessageContainerRef, handleInputChange, handleImageUpload, isMessageBoxEmpty, handleMessageSend}) => {
    const navigate = useNavigate();
    const messageImageRef = useRef(null);
    const messageImagePreviewRef = useRef(null);
    const messageImagePreviewFigure = useRef(null);
    const currentChatMessagesContainerRef = useRef(null);
    const [ messageImageError, setMessageImageError ] = useState("");

    useScrollToBottom(currentChatMessagesContainerRef);

    const handleAddMessageImage = () => {
        // if there is no reference to the input with a type of file
        if (!messageImageRef.current) return;

        // clicking on the input with a type of file
        messageImageRef.current.click()
    };
    
    const handleImageLoad = (e) => {
        if (e.target.files && e.target.files[0]){

            // checking if the tweet media file to be added is an image
            if (!checkImageFile(e.target.files[0].type)) {
                setMessageImageError("Please select an image");
                setTimeout(() => setMessageImageError(""), 3000);
                return;
            };

            // creating a new data url to let the user preview the new message image added
            Formatter.convertFileObjectToImageStr(e.target.files[0]).then((resultingImageStr) => {
                
                messageImagePreviewRef.current.src = resultingImageStr;
                messageImagePreviewFigure.current.style.display = "block";

                handleImageUpload(e.target.files[0]);
           
            }).catch(err => {
                setMessageImageError("An error occured while trying to load the image");
            });

        }
    }

    // removing the image preview display in the new message box(after it is sent)
    const removeImagePreviewDisplay = () => {
        messageImagePreviewRef.current.src = "";
        messageImagePreviewFigure.current.style.display = "none";
    }

    return (
    <>
    <div className="user-chat-page-container">
        <div className="current-chat-user-details" ref={currentUserDetailsRef}>
            <div className="back-icon-container" onClick={handleBackIconClick}>
                <ArrowBackIosNewIcon className="back-icon" />
            </div>
            <div className="current-chat-user">
                <div className="current-chat-user-display-name" onClick={() => navigate(`/${currentActiveUserChat.username}`)}>{currentActiveUserChat.displayName}</div>
                <div className="current-chat-user-username" onClick={() => navigate(currentActiveUserChat.username)}>&#64;{currentActiveUserChat.username}</div>
            </div>
            <div className="info-icon-container">
                <InfoIcon className="info-icon" />
            </div>
        </div>

        <div className="current-chat-messages" ref={currentChatMessagesContainerRef}> 
            {
                React.Children.toArray(messages.map(message => {
                    return <>
                    <div className={`${message.type === "sent" ? "sent-message-container" : "received-message-container"}`}>
                        <span style={{whiteSpace: "pre-line"}}>{message.messageContent}</span>
                        {
                            message.messageImage && 
                            <img 
                                src={
                                    message.messageImage instanceof File ?
                                    Formatter.convertFileObjectToImageStr(message.messageImage).then(resultingImageStr => resultingImageStr) :
                                    message.messageImage instanceof ArrayBuffer ? 
                                    `${Formatter.convertBufferArrayToImageStr(message.messageImage)}` : `${Formatter.formatImageStr(message.messageImage)}`
                                }
                                alt="chat media" 
                            />
                        } 
                        <div className={`creation-time ${message.messageImage && "image-present"}`}>{Formatter.formatDateTime(message.createdAt)}</div>
                    </div>
                    </>
                }))
            }
                          
        </div>
    </div>

    <div className="current-chat-actions-container" ref={createMessageContainerRef}>
        <div className="add-image-container" onClick={handleAddMessageImage}>
            <label htmlFor="messageImage" />
            <input type="file" name="messageImage" ref={messageImageRef} onChange={handleImageLoad} accept="images/*" />
            <Panorama />
        </div>
        <div className="new-message-container">
            <textarea name="messageContent" placeholder="Start a message" value={newMessage.messageContent} onChange={handleInputChange} rows="1" cols="10" />
            <figure ref={messageImagePreviewFigure}><img ref={messageImagePreviewRef} src="" alt="" /></figure>
            {messageImageError && <div className="error-message">{messageImageError}</div>}
        </div>
        <div className="send-message-container">
            {isMessageBoxEmpty ? <MenuIcon className="message-icon" /> : <Send className="message-icon" onClick={() => { handleMessageSend(); removeImagePreviewDisplay();} } />}
        </div>
    </div>
    </>
    );
}

export default ChatRoom;