import { useRef, useState } from "react";
import MobileNavigationBar from "../components/MobileNavigationBar";
import NavigationBar from "../components/NavigationBar";
import TweetNavigationSideBar from "../components/TweetNavigationSideBar";
import useChangeElementPropertyOnScroll from "../hooks/useChangeElementPropertyOnScroll";
import useOffsetFromElement from "../hooks/useOffsetFromElement";


const Bookmarks = ({ user }) => {
    const navBarRef = useRef(null);
    const bookmarksContainerRef = useRef(null);
    const mobileNavBarRef = useRef(null);
    const [tweetCategory, setTweetCategory] = useState("Tweets");
    const [tweetCategoryLocation, setTweetCategoryLocation] = useState("tweets");
    
    useOffsetFromElement(navBarRef, bookmarksContainerRef, 15);
    useChangeElementPropertyOnScroll(navBarRef, "position", "fixed", "absolute");
    useChangeElementPropertyOnScroll(mobileNavBarRef, "display", "flex", "none");

    // handle click on a tweet category
    const handleTweetCategoryChange = (category) => {
        setTweetCategory(category);
        setTweetCategoryLocation(category.toLocaleLowerCase().replace(" ", "").replace(" ", "").replace("&", "+"));
    }; 

    
    return <>
        <NavigationBar user={user} navigationBarReference={navBarRef} />
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
        <MobileNavigationBar navigationRef={mobileNavBarRef} />
    </>
}

export default Bookmarks;
