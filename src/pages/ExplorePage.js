import { useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";
import MobileNavigationBar from "../components/MobileNavigationBar";
import NavigationBar from "../components/NavigationBar";
import TweetNavigationSideBar from "../components/TweetNavigationSideBar";
import useChangeElementPropertyOnScroll from "../hooks/useChangeElementPropertyOnScroll";
import useOffsetFromElement from "../hooks/useOffsetFromElement";
import useTitle from "../hooks/useTitle";


const ExplorePage = ({ user }) => {
    const ref = useRef(null);
    const ref2 = useRef(null);
    const ref3 = useRef(null);
    const isSmallScreen = useMediaQuery({query: "(max-width: 767px)"});
    const [exploreCategory, setExploreCategory] = useState("Top");
    const [exploreCategoryLocation, setExploreCategoryLocation] = useState("top");
    
    useTitle("Tweeter | Explore");

    useOffsetFromElement(ref, ref2, 15);
    useChangeElementPropertyOnScroll(ref, "position", "fixed", "absolute");
    useChangeElementPropertyOnScroll(ref3, "display", "flex", "none");

    // handle click on a tweet category
    const handleTweetCategoryChange = (category) => {
        setExploreCategory(category);
        setExploreCategoryLocation(category.toLocaleLowerCase());
    }

    return <>
        <NavigationBar user={user} navigationBarReference={ref} />
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
        <MobileNavigationBar navigationRef={ref3} />
    </>
}

export default ExplorePage;
