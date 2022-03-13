import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useMediaQuery } from "react-responsive";
import Logo from "../components/Logo";
import UserProfileDropDown from "../components/UserProfileDropDown";
import { Link } from "react-router-dom";

const NavigationBar = ({ user, disableDropDown, disableNavLinks, removeDropDownIcon, navigationBarReference, className }) => {
    const navigate = useNavigate();
    const ref1 = useRef(null);
    const ref2 = useRef(null);
    const ref3 = useRef(null);
    const ref4 = useRef(null);
    const largeScreen = useMediaQuery({query: "(min-width: 768px)"});


    // handle click on navigation link
    const handleClick = (location) => {
        if (disableNavLinks) return;

        navigate(location);
    }

    // useEffect hook to add a blue-bar under the links and color it blue based on the current page the user is on
    useEffect( () => {

        [ref1, ref2, ref3, ref4].forEach(element => {
            if (!largeScreen) return;

            if (!element.current) return;

            if (window.location.href === element.current.href){
                element.current.classList.add("current-page");
                element.current.nextSibling.style.visibility = "visible";
            }
        });
    }, [ref1, ref2, ref3, ref4, largeScreen])

    return <div className={`navigation-bar-container ${className ? className : "" }`} ref={navigationBarReference} >
        <nav>
            <div className="navigation-bar-display">
                <Logo />
                {
                    largeScreen && <div className={`navigation-links-large-container ${user ? "": "not-logged-in"}`}>
                        <div className="navigation-links">
                            <Link ref={ref1} to="/" onClick={() => handleClick("/") } aria-label="go to home page">Home</Link>
                            <span className="slider"></span>
                        </div>
                        <div className="navigation-links">
                            <Link ref={ref2} to="/explore" onClick={() => handleClick("/explore") } aria-label="find out more about what's happening in the world">Explore</Link>
                            <span className="slider"></span>    
                        </div>
                        {user && <div className="navigation-links">
                            <Link ref={ref3} to="/bookmarks" onClick={() => handleClick("/bookmarks") } aria-label="go to your bookmarks">Bookmarks</Link>
                            <span className="slider"></span>
                        </div>}
                        {user && <div className="navigation-links">
                            <Link ref={ref4} to="/messages" onClick={() => handleClick("/messages") } aria-label="go to your messages">Messages</Link>
                            <span className="slider"></span>
                        </div>}
                    </div>
                }
                {
                    user && <UserProfileDropDown 
                                displayName={user.displayName ? user.displayName : "New User"}
                                username={user.username} 
                                disableDropDown={disableDropDown} removeDropDownIcon={removeDropDownIcon} 
                                profilePhoto={user.profilePhoto}
                            />
                }
                {
                    !user && <div className="login-container">
                        <div className="login-container items">
                            <Link to="/login" onClick={ () => handleClick("/login") }>Login</Link>
                            <Link to="/signup" onClick={ () => handleClick("/signup") }>Register</Link>
                        </div>
                    </div>
                }
            </div>
        </nav>
    </div>
}

export default NavigationBar;
