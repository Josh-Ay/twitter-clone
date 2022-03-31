import React, { useEffect, useRef, useState } from "react";
import MobileNavigationBar from "../components/MobileNavigationBar";
import NavigationBar from "../components/NavigationBar";
import UsersPopup from "../components/UsersPopup";
import UserItem from "../components/UserItem";
import ChatRoom from "../components/ChatRoom";
import useChangeElementPropertyOnScroll from "../hooks/useChangeElementPropertyOnScroll";
import useTitle from "../hooks/useTitle";
import useClickOutside from "../hooks/useClickOutside";
import ChatIcon from '@material-ui/icons/Chat';
import { useMediaQuery } from "react-responsive";
import { Request } from "../requests/Request";
import { checkIfListIsEmpty } from "../validators/Validators";
import MessagesSkeletonContainer from "../components/MessagesSkeletonContainer";


const MessagesPage = ( { user, socketInstance } ) => {
    const mobileNavRef = useRef(null);
    const createMessageContainerRef = useRef(null);
    const currentUserDetailsRef = useRef(null);
    const ref = useRef(null);
    const [isUserActive, setUserActive] = useState(false);
    const [ isActive, setActive ] = useState(false);
    
    const [newMessage, setNewMessage] = useState({
        messageContent: "",
        messageImage: "",
        type: "",
        status: "0",
        createdAt: ""
    });

    const [currentActiveUserChat, setCurrentActiveUserChat] = useState({
        displayName: "",
        username: "",
        userId: "",
        socketId: ""
    });

    const [allMessages, setAllMessages] = useState([]);
    const [currentChatMessages, setCurrentChatMessages] = useState([]);
    const [isMessageBoxEmpty, setIsMessageBoxEmpty] = useState(true);
    const [fetchedUsersData, setFetchedUsersData] = useState([]);
    const [followingUsersData, setFollowingUsersData] = useState([]);
    const [fetchUsersDataError, setFetchUsersDataError] = useState(null);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [isSearchQueryEmpty, setIsSearchQueryEmpty] = useState(true);
    const isSmallScreen = useMediaQuery({query: "(max-width: 767px)"});
    const isVerySmallScreen = useMediaQuery({query: "(max-width: 576px)"});
    const [isUsersLoading, setIsUsersLoading] = useState(true);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [unreadMessages, setUnreadMessages] = useState(false);

    useTitle("Messages | Tweeter");
    useChangeElementPropertyOnScroll(mobileNavRef, "display", "flex", "none");
    useChangeElementPropertyOnScroll(createMessageContainerRef, "bottom", isSmallScreen ? isVerySmallScreen ? "7.7%" : "11%" : "0", "0");
    useClickOutside(ref, () => setActive(false));
    
    // handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMessage(prevValue => {
            return { ...prevValue, [name]: value, "type": "sent" };
        })
    }

    // useEffect hook to get the list of messages between the user and other users
    useEffect(() => {
        Request.makeGetRequest(`/messages/${user._id}`).then(res => {
            setIsPageLoading(false);
            setAllMessages(res.data.userMessages);
            res.data.userMessages.map(userMessageItem => userMessageItem.messages.filter(message => message.status === "1")).flat().length >= 1 ? setUnreadMessages(true) : setUnreadMessages(false);
        }).catch(err => {
            setIsPageLoading(false);
            console.log("An error occurred while trying to fetch your messages");
        })
    }, [user._id]);

    // useEffect hook to monitor a new message being received
    useEffect(() => {
        socketInstance.on("receive-message", message => {
            message.type = "received";
            message.status = 1;
            setCurrentChatMessages(prevMessages => {
                return [...prevMessages, message];
            });
        }); 
    }, [socketInstance]);


    // useEffect hook to monitor whether or not the new message box is empty
    useEffect(() => {
        if (newMessage.messageContent.length < 1 && newMessage.messageImage === "") return setIsMessageBoxEmpty(true);

        setIsMessageBoxEmpty(false);

    }, [newMessage.messageContent, newMessage.messageImage]);


    // useEffect hook to monitor a user searching through the list of users currently followed by the user
    useEffect(() => {
        if (userSearchQuery.length < 1) return setIsSearchQueryEmpty(true);

        setIsSearchQueryEmpty(false);

        setFetchedUsersData(followingUsersData.filter(user => user.username.toLocaleLowerCase().includes(userSearchQuery.toLocaleLowerCase()) || user.displayName.toLocaleLowerCase().includes(userSearchQuery.toLocaleLowerCase())))

    }, [userSearchQuery, followingUsersData]);


    // useEffect hook to get the users that a user is following
    useEffect(() => {

        Request.makeGetRequest(`/users/${user._id}/following`)
        .then(res => {
            setIsUsersLoading(false)
            setFollowingUsersData(res.data.following);
        })
        .catch(err => {
            setIsUsersLoading(false)
            setFetchUsersDataError("An error occurred while trying to fetch the requested resource");
        });

    }, [user._id]);


    // handle chat room open
    const handleChatRoomOpen = (userDisplayName, username, userId, socketId) => {
        setUserActive(true);
        setActive(false);
        
        const updatedChatMessages = allMessages.filter(user => user.username === username).map(message => message.messages).flat();
        
        setCurrentChatMessages(updatedChatMessages);
        
        setCurrentActiveUserChat({
            displayName: userDisplayName,
            username: username,
            userId: userId,
            socketId: socketId
        });

        // marking all messages as read
        Request.makePostRequest(`/messages/${userId}/${user._id}/update_read`, { message: "update" }).then(res => {
            setAllMessages(res.data.updatedUserMessages);
            setUnreadMessages(false) // to update the indicator on the navigation bar
        }).catch(err => {
            console.log("An error occurred while trying to update your messages");
        })
    };

    // handle image upload
    const handleImageUpload = (imageFile) => {
        setNewMessage(prevValue => {
            return {...prevValue, "messageImage": imageFile, "type": "sent"};
        })
    }
    
    // handle sending a new message
    const handleMessageSend = async () => {
        if (currentActiveUserChat.socketId === "" || !currentActiveUserChat.socketId) return;

        // updating the new message object to include the time it's sent
        const updatedNewMessage = newMessage
        updatedNewMessage.createdAt = new Date();
        setNewMessage(updatedNewMessage);
        
        // getting the receiver's current socket id
        await socketInstance.emit("get-user-socket-id", currentActiveUserChat.userId, (res) => {
            setCurrentActiveUserChat(prevValue => {
                return {...prevValue, "socketId": res.userSocketId}
            });
            
            // sending the message to the fetched receiver's socket id
            socketInstance.emit("send-message", newMessage, res.userSocketId);

            // updating the current chat messages
            setCurrentChatMessages(prevMessages => {
                return [...prevMessages, newMessage];
            });
            
            // clearing the new message content
            setNewMessage({
                messageContent: "",
                messageImage: "",
                type: "",
                status: "0"
            });

            // creating a new form
            const formData = new FormData();

            // appending each key in the `newTweet` object to the new form created
            for (let key in newMessage) { formData.append(key, newMessage[key]) };

            // saving the message in the database
            Request.makeMultipartPostRequest(`/messages/${user._id}/${currentActiveUserChat.userId}`, formData)
            .then(res => {
                setAllMessages(res.data.updatedUserMessages);
            }).catch(err => {
                console.log("An error occurred while trying to save your message");
            })
        });

    };

    // handle back icon click
    const handleBackIconClick = () => setUserActive(false);

    // handle search input change
    const handleUserSearchInputChange = (e) => setUserSearchQuery(e.target.value);


    return <>
        <NavigationBar user={user} className="rel-nav-bar" unreadMessagesIndicator={unreadMessages} />
        <main>
            {
                !isUserActive && <div className="messages-page-container">
                    {
                        isPageLoading ? <MessagesSkeletonContainer /> : 
                        <>
                        <h3 className="title-text normal-size">Messages</h3>
                        {
                            checkIfListIsEmpty(allMessages) ?
                            <>
                                <div className="get-started-message-container">
                                    <h4 className="title-text small-size">Send a message, get a message</h4>
                                    <span>
                                        Direct messages are private conversations between
                                        you and the other people on Tweeter. Get started today by clicking 
                                        the circular button below at the right-hand side of the screen.
                                    </span>
                                </div>

                            </> : React.Children.toArray(allMessages.map(currentUser => {
                            return <>
                                <UserItem user={currentUser} handleUserItemClick={handleChatRoomOpen} />
                            </>
                            }))
                        }
                        </>
                    }
                    
                </div>
            }

            {
                isUserActive && <> 
                    <ChatRoom   
                        currentUserDetailsRef={currentUserDetailsRef} 
                        handleBackIconClick={handleBackIconClick} 
                        currentActiveUserChat={currentActiveUserChat}
                        messages={currentChatMessages}
                        newMessage={newMessage} 
                        createMessageContainerRef={createMessageContainerRef} 
                        handleInputChange={handleInputChange} 
                        isMessageBoxEmpty={isMessageBoxEmpty}
                        handleImageUpload={handleImageUpload} 
                        handleMessageSend={handleMessageSend}
                    />
                </>
            }

            {
                !isUserActive && <>
                    <button className="start-new-chat-btn" onClick={() => setActive(true)}><ChatIcon /></button>
                </>
            }

            {
                isActive && <>
                    <UsersPopup   
                        userPopupRef={ref} 
                        user={user}
                        userSearchQuery={userSearchQuery} 
                        handleUserSearchInputChange={handleUserSearchInputChange} 
                        isSearchQueryEmpty={isSearchQueryEmpty} 
                        setUserSearchQuery={setUserSearchQuery} 
                        setActive={setActive}
                        usersDataToShow={followingUsersData}
                        searchResults={fetchedUsersData}
                        isUsersLoading={isUsersLoading}
                        fetchError={fetchUsersDataError}
                        handleUserItemClick={handleChatRoomOpen}
                    />
                </>
            }
        </main>
        <MobileNavigationBar navigationRef={mobileNavRef} unreadMessagesIndicator={unreadMessages} />
    </>
}

export default MessagesPage;