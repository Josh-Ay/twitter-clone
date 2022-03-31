import useTitle from "../hooks/useTitle";
import NavigationBar from "../components/NavigationBar";
import { useNavigate } from "react-router-dom";
import MobileNavigationBar from "../components/MobileNavigationBar";
import { useEffect, useState } from "react";
import { Request } from "../requests/Request";

const PageNotFound = ( {user, navigationBarReference} ) => {
    const navigate = useNavigate();
    const [unreadMessages, setUnreadMessages] = useState(false);
    
    useTitle("404 | Page Not Found");

    // useEffect hook to check if the current user has any unread messages
    useEffect(() => {
        Request.makeGetRequest(`/messages/${user._id}`).then(res => {
            if(res.data.userMessages.map(messageItem => messageItem.messages.filter(message => message.status === "1")).flat().length >= 1 ) return setUnreadMessages(true);

            setUnreadMessages(false);

        }).catch(err => {
            console.log("An error occured while trying to fetch current user's messages")
        });
        
    }, [user._id])

    const handleClick = () => navigate("/"); 
    
    return <>
        <NavigationBar user={user ? user: ""} navigationBarReference={navigationBarReference} unreadMessagesIndicator={unreadMessages} />
        <main>
            <div className="main-container page-not-found-container">
                <figure>
                    <img src="/assets/404-page-not-found.svg" alt="404 resource not found illustration"/>
                </figure>
                <h1>404 not found</h1>
                <p>Requested resource does not exist or has been removed</p>
                <button className="go-home-btn" onClick={handleClick}>Go Home</button>
            </div>
        </main>
        <MobileNavigationBar unreadMessagesIndicator={unreadMessages} />
    </>
}

export default PageNotFound;