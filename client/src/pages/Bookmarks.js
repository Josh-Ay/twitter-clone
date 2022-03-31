import { useEffect, useRef, useState } from "react";
import MobileNavigationBar from "../components/MobileNavigationBar";
import NavigationBar from "../components/NavigationBar";
import TweetNavigationSideBar from "../components/TweetNavigationSideBar";
import useChangeElementPropertyOnScroll from "../hooks/useChangeElementPropertyOnScroll";
import useOffsetFromElement from "../hooks/useOffsetFromElement";
import useTitle from "../hooks/useTitle";
import { Request } from "../requests/Request";


const Bookmarks = ({ user }) => {
    const navBarRef = useRef(null);
    const bookmarksContainerRef = useRef(null);
    const mobileNavBarRef = useRef(null);
    const [tweetCategory, setTweetCategory] = useState("Tweets");
    const [tweetCategoryLocation, setTweetCategoryLocation] = useState("tweets");
    const [unreadMessages, setUnreadMessages] = useState(false);
    
    useTitle("Bookmarks");

    useOffsetFromElement(navBarRef, bookmarksContainerRef, 15);
    useChangeElementPropertyOnScroll(navBarRef, "position", "fixed", "absolute");
    useChangeElementPropertyOnScroll(mobileNavBarRef, "display", "flex", "none");

    // handle click on a tweet category
    const handleTweetCategoryChange = (category) => {
        setTweetCategory(category);
        setTweetCategoryLocation(category.toLocaleLowerCase().replace(" ", "").replace(" ", "").replace("&", "+"));
    }; 

    // useEffect hook to check if the current user has any unread messages
    useEffect(() => {
        Request.makeGetRequest(`/messages/${user._id}`).then(res => {
            if(res.data.userMessages.map(messageItem => messageItem.messages.filter(message => message.status === "1")).flat().length >= 1 ) return setUnreadMessages(true);

            setUnreadMessages(false);

        }).catch(err => {
            console.log("An error occured while trying to fetch current user's messages")
        });
        
    }, [user._id])


    
    return <>
        <NavigationBar user={user} navigationBarReference={navBarRef} unreadMessagesIndicator={unreadMessages} />
        <main>
            <div className="bookmarks-page-container" ref={bookmarksContainerRef} >
                <TweetNavigationSideBar
                    userId={user._id}
                    currentUserDisplayImage={user.profilePhoto}
                    currentUserUsername={user.username}
                    currentUserDisplayName={user.displayName}
                    tweetType="bookmarks"
                    categoryToGet={tweetCategory} 
                    categoryLocation={tweetCategoryLocation}
                    firstCategoryTitle="Tweets"
                    secondCategoryTitle="Tweets & Replies" 
                    thirdCategoryTitle="Media"
                    fourthCategoryTitle="Likes"
                    handleTweetCategoryChange={handleTweetCategoryChange}
                 />
            </div>
        </main>
        <MobileNavigationBar navigationRef={mobileNavBarRef} unreadMessagesIndicator={unreadMessages} />
    </>
}

export default Bookmarks;
