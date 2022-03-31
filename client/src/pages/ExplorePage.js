import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";
import MobileNavigationBar from "../components/MobileNavigationBar";
import NavigationBar from "../components/NavigationBar";
import TweetNavigationSideBar from "../components/TweetNavigationSideBar";
import useChangeElementPropertyOnScroll from "../hooks/useChangeElementPropertyOnScroll";
import useOffsetFromElement from "../hooks/useOffsetFromElement";
import useTitle from "../hooks/useTitle";
import { Request } from "../requests/Request";


const ExplorePage = ({ user }) => {
    const ref = useRef(null);
    const ref2 = useRef(null);
    const ref3 = useRef(null);
    const isSmallScreen = useMediaQuery({query: "(max-width: 767px)"});
    const [exploreCategory, setExploreCategory] = useState("Top");
    const [exploreCategoryLocation, setExploreCategoryLocation] = useState("top");
    const [unreadMessages, setUnreadMessages] = useState(false);
    
    useTitle("Tweeter | Explore");

    useOffsetFromElement(ref, ref2, 15);
    useChangeElementPropertyOnScroll(ref, "position", "fixed", "absolute");
    useChangeElementPropertyOnScroll(ref3, "display", "flex", "none");

    // handle click on a tweet category
    const handleTweetCategoryChange = (category) => {
        setExploreCategory(category);
        setExploreCategoryLocation(category.toLocaleLowerCase());
    }

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
        <NavigationBar user={user} navigationBarReference={ref} unreadMessagesIndicator={unreadMessages} />
        <main>
            <div className="explore-page-container" ref={ref2} >
                <TweetNavigationSideBar
                    userId={user._id}
                    currentUserDisplayImage={user.profilePhoto}
                    currentUserUsername={user.username}
                    currentUserDisplayName={user.displayName}
                    categoryToGet={exploreCategory}
                    categoryLocation={exploreCategoryLocation}
                    firstCategoryTitle="Top"
                    firstCategory=""
                    secondCategoryTitle="Latest"
                    secondCategory=""
                    thirdCategoryTitle="People"
                    thirdCategory=""
                    fourthCategoryTitle="Media"
                    fourthCategory=""
                    handleTweetCategoryChange={handleTweetCategoryChange}
                    showSearchBox={true}
                    showSearchBoxForSmallScreen={isSmallScreen}
                 />
            </div>
        </main>
        <MobileNavigationBar navigationRef={ref3} unreadMessagesIndicator={unreadMessages} />
    </>
}

export default ExplorePage;
