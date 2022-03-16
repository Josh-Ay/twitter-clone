import { useEffect, useRef } from "react";
import HomeIcon from '@material-ui/icons/Home';
import ExploreIcon from '@material-ui/icons/Explore';
import BookmarkIcon from '@material-ui/icons/Bookmark'; 
import ChatBubbleIcon from '@material-ui/icons/ChatBubble';
import { useMediaQuery } from "react-responsive";
import { Link } from "react-router-dom";

const MobileNavigationBar = ({ navigationRef, unreadMessagesIndicator }) => {
    const isSmallScreen = useMediaQuery({query: "(max-width: 767px)"});
    const ref1 = useRef(null);   
    const ref2 = useRef(null);   
    const ref3 = useRef(null);   
    const ref4 = useRef(null);

    // useEffect hook to add a blue-bar under the links and color it blue based on the current page the user is on
    useEffect(() => {
        [ref1, ref2, ref3, ref4].forEach(element => {
            if (!isSmallScreen) return;

            if (!element.current) return;

            if (window.location.href === element.current.href){
                element.current.classList.add("current-page");
                element.current.nextSibling.style.visibility = "visible";
            }
        });
    }, [ref1, ref2, ref3, ref4, isSmallScreen])

    
    return <>
    { 
        isSmallScreen && <div ref={navigationRef} className="small-navigation-links-container">
            <div className="navigation-links">
                <Link ref={ref1} to="/" aria-label="go to home page"><HomeIcon /></Link>
                <span className="slider"></span>
            </div>
            <div className="navigation-links">
                <Link ref={ref2} to="/explore" aria-label="find out more about what's happening in the world"><ExploreIcon /></Link>
                <span className="slider"></span>    
            </div>
            <div className="navigation-links">
                <Link ref={ref3} to="/bookmarks" aria-label="go to your bookmarks"><BookmarkIcon /></Link>
                <span className="slider"></span>
            </div>
            <div className="navigation-links">
                <Link ref={ref4} to="/messages" aria-label="go to your messages"><ChatBubbleIcon /></Link>
                <span className="slider"></span>
                {unreadMessagesIndicator && <div className="blue-dot"></div>}
            </div>
        </div>
    }
    </>
}

export default MobileNavigationBar;
