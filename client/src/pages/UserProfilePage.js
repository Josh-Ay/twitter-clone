import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Request } from "../requests/Request";
import { checkIfItemInList } from "../validators/Validators";
import LoadingPage from "./LoadingPage";
import PageNotFound from "./PageNotFound";
import useTitle from "../hooks/useTitle";
import NavigationBar from "../components/NavigationBar";
import UserPicture from "../components/UserPicture";
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import TweetNavigationSideBar from "../components/TweetNavigationSideBar";
import CryptoJS from "crypto-js";
import UserProfileForm from "../components/UserProfileForm";
import useChangeElementPropertyOnScroll from "../hooks/useChangeElementPropertyOnScroll";
import MobileNavigationBar from "../components/MobileNavigationBar";
import { Formatter } from "../helpers/Formatter";
import CheckIcon from '@material-ui/icons/Check';
import GroupsPage from "./GroupsPage";
import UsersPopup from "../components/UsersPopup";
import useClickOutside from "../hooks/useClickOutside";
import { useNavigate } from 'react-router';


require("dotenv").config();

const UserProfilePage = ({ loggedInUser, updateCurrentUser, notSocialUser }) => {
    const requestedUser = useParams();
    const [isUserRegistered, setUserRegistered] = useState(null);
    const [requestedUserData, setRequestedUserData] = useState(null);
    const [isLoggedIn, setLoggedIn] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isFollowing, setFollowing] = useState(false);
    const [tweetCategory, setTweetCategory] = useState("Tweets");
    const [tweetCategoryLocation, setTweetCategoryLocation] = useState("tweets");
    const [settingsParameterPassed, setSettingsParameterPassed] = useState(false);
    const [groupsParameterPassed, setGroupsParameterPassed] = useState(false);
    const navBarRef = useRef(null);
    const mobileNavRef = useRef(null);
    const ref = useRef(null);
    
    const parameterPassed = window.location.search;
    const params = new URLSearchParams(parameterPassed);
    const query = params.get("tab");

    const [allowClick, setAllowClick] = useState(false);
    const [ isActive, setActive ] = useState(false);
    const [fetchedUsersData, setFetchedUsersData] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [fetchUsersDataError, setFetchUsersDataError] = useState("");
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [isSearchQueryEmpty, setIsSearchQueryEmpty] = useState(true);
    const [isUsersLoading, setIsUsersLoading] = useState(true);
    const [userDetails, setUserDetails] = useState({
        displayName: "",
        username: "",
        userBio: "",
        type: "update"
    });
    const [userDetailsError, setUserDetailsError] = useState("");
    
    const navigate = useNavigate()
    

    useTitle(`${requestedUser.user} | Tweeter`);
    useChangeElementPropertyOnScroll(navBarRef, "position", "fixed", "absolute");
    useChangeElementPropertyOnScroll(mobileNavRef, "display", "flex", "none");
    useClickOutside(ref, () => setActive(false));


    useEffect(() => {
        // making a get request to server to check if the requested username entered is registered
        Request.makeGetRequest("/usernames").then(res => {
            const bytes  = CryptoJS.AES.decrypt(res.data.usernames, process.env.REACT_APP_AES_SECRET_KEY);
            const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));        

            const allUsernames = decryptedData;
            const userExists = checkIfItemInList(allUsernames, requestedUser.user, "username");

            // if the user does not exist
            if (!userExists){
                setPageLoading(false);
                setUserRegistered(false); 
                return;
            }

            // the user exists
            setUserRegistered(true);
            setUserDetails(prevValue => {
                return {
                    ...prevValue, 
                    displayName: loggedInUser.displayName,
                    username: loggedInUser.username,
                    userBio: loggedInUser.about
                }
            });
            setRequestedUserData(allUsernames.find(user => user.username === requestedUser.user)); 
            
            setPageLoading(false);

            return;

        }).catch(err => {
            console.log("An error occured while trying to connect to the server.");
            setPageLoading(false);
            
        })
        
    }, [requestedUser.user, loggedInUser.username, loggedInUser.about, loggedInUser.displayName]);


    // 'useEffect' hook to check if there's a currently logged-in user
    useEffect(() => {
        if (loggedInUser !== "undefined"){ 
            setLoggedIn(true);

            if (query) {
                if (query === "groups") return setGroupsParameterPassed(true);
                if (query === "settings") return setSettingsParameterPassed(true);
                
                return <PageNotFound user={loggedInUser} navigationBarReference={navBarRef} />
            };

            setGroupsParameterPassed(false);
            setSettingsParameterPassed(false);

            return;
        }

        setLoggedIn(false);
        
    }, [loggedInUser, query]);


    // 'useEffect' hook to check if the logged-in user is following the user whose page is requested
    useEffect(() => {

        if((!requestedUserData) || (!loggedInUser)) return;

        const isUserAlreadyFollowingRequestedProfile = checkIfItemInList(requestedUserData.followers, loggedInUser._id, "_id");

        if (!isUserAlreadyFollowingRequestedProfile) return setFollowing(false);

        setFollowing(true);

    }, [requestedUserData, loggedInUser._id, loggedInUser]);


    // useEffect hook to monitor searching through either the user's following or followers
    useEffect(() => {
        if (userSearchQuery.length < 1) return setIsSearchQueryEmpty(true);

        setIsSearchQueryEmpty(false);

        setSearchResults(fetchedUsersData.filter(user => user.username.toLocaleLowerCase().includes(userSearchQuery.toLocaleLowerCase()) || user.displayName.toLocaleLowerCase().includes(userSearchQuery.toLocaleLowerCase())));

    }, [userSearchQuery, fetchedUsersData]);


    // useEffect hook to monitor the username entered and validate that its not used by another user
    useEffect(() => {
        if (userDetails.username.length < 1 && !pageLoading) {
            setUserDetailsError("Please enter a username");
            setAllowClick(false);
            return;
        }

        // no spaces in username
        if(userDetails.username.includes(" ")) {
            setUserDetailsError("Please do not spaces in your username");
            setAllowClick(false);
            return;
        }
        
        Request.makeGetRequest("/usernames").then(res => {
            const allUsernames = JSON.parse(CryptoJS.AES.decrypt(res.data.usernames, process.env.REACT_APP_AES_SECRET_KEY).toString(CryptoJS.enc.Utf8));        

            const usernameIsTaken = checkIfItemInList(allUsernames, userDetails.username, "username");
            
            if ( (userDetails.username !== loggedInUser.username) && (usernameIsTaken)) {
                setUserDetailsError("Username already taken");
                setAllowClick(false);
                return;
            };

            setAllowClick(true);

        }).catch(err => {
            setUserDetailsError("An error occurred while trying to fetch the requested resource.");
        })
    
    }, [userDetails.username, loggedInUser.username, pageLoading])


    // checking if the requested username cannot be found
    if (!isUserRegistered && !pageLoading) {
        return <PageNotFound user={loggedInUser} navigationBarReference={navBarRef} />
    }

    // handle click on tweet category
    const handleTweetCategoryChange = (category) => {
        setTweetCategory(category);
        setTweetCategoryLocation(category.toLocaleLowerCase().replace(" ", "").replace(" ", "").replace("&", "+"));
    };

    // handle click on follow button
    const handleFollowButtonClick = () => {
        if (isFollowing) return;

        setLoading(true);
        
        Request.makePostRequest(`/users/${loggedInUser._id}/follow/${requestedUserData._id}`)
        .then(res => {
            setLoading(false);
            updateCurrentUser(res.data.newFollower);
            setRequestedUserData(res.data.followedUser); 
        })
        .catch(err => {
            setLoading(false);
        });
    };

    // handle search input change
    const handleUserSearchInputChange = (e) => setUserSearchQuery(e.target.value);

    // handle click on following or followers count span
    const handleUserFollowCountClick = (followerCategory) => {
        setActive(true);

        Request.makeGetRequest(`/users/${requestedUserData._id}/${followerCategory}`)
        .then(res => {
            setIsUsersLoading(false);
            setFetchedUsersData(res.data[`${followerCategory}`]);
        })
        .catch(err => {
            setIsUsersLoading(false);
            setFetchUsersDataError("An error occurred while trying to fetch the requested resource");
        });
    };

    // handle click on user item
    const handleUserItemClick = (...params) => {
        setActive(false);
        navigate(`/${params[1]}`);
    }

    // handle change in user details
    const handleChangeInUserDetailsInput = (e) => {
        const { name, value } = e.target;
        setUserDetails(prevValue => {
            return {...prevValue, [name]: value};
        });
        if( name === "username") setUserDetailsError("");
    }

    // handle update on user details
    const handleUserDetailsSubmitClick = (e) => {
        e.preventDefault();

        if (userDetails.displayName.length < 1) return setUserDetailsError("Please enter a display name");
        
        if (userDetails.username.length < 1) return setUserDetailsError("Please enter a username");
        
        if (!allowClick) return;

        Request.makePatchRequest(`/users/${loggedInUser._id}`, userDetails).then(res => {
            
            updateCurrentUser(res.data.user);
            if (notSocialUser) localStorage.setItem("userData", JSON.stringify(res.data.user));
            navigate(-1);
        }).catch(err => {
            setUserDetailsError(err.response.data.error);
        });

    }


    return <>
        {pageLoading && <LoadingPage />}

        {!pageLoading && 
            
            <>
                <NavigationBar user={isLoggedIn ? loggedInUser: ""} removeDropDownIcon={isLoggedIn && true} navigationBarReference={navBarRef} />

                <main>
                    <div className="user-profile-page-container">
                        {
                            settingsParameterPassed && requestedUserData._id === loggedInUser._id &&
                            <UserProfileForm
                                user_id={loggedInUser._id}
                                title="Change Info"
                                profilePhoto={loggedInUser.profilePhoto}
                                coverPhoto={loggedInUser.coverPhoto}
                                displayName={userDetails.displayName}
                                username={userDetails.username}
                                bio={userDetails.userBio}
                                showCancelBtn={true}
                                allowClick={allowClick}
                                handleInputChange={handleChangeInUserDetailsInput}
                                errorMsg={userDetailsError}
                                handleSubmitClick={handleUserDetailsSubmitClick}
                                notSocialUser={notSocialUser}
                                updateCurrentUser={
                                    (userData) => {
                                        updateCurrentUser(userData);
                                        setAllowClick(true);
                                    }
                                }
                            />
                        }

                        {
                            groupsParameterPassed && requestedUserData._id === loggedInUser._id &&
                            <GroupsPage />
                        }
                        
                        {
                            !settingsParameterPassed && !groupsParameterPassed && requestedUserData && <>
                                <div className="user-profile-cover-photo" style={{background: `${requestedUserData.coverPhoto ? `url(${Formatter.formatImageStr(requestedUserData.coverPhoto)})` : "url(/assets/default-background-pic.jpg)"}`}} ></div>
                                <div className="user-display-details-container">
                                    <div className="user-picture-canvas"></div>
                                    <UserPicture displayPicture={requestedUserData.profilePhoto} />
                                    <div className={`user-display-details ${`${requestedUserData._id === loggedInUser._id ? "current-user" : ""}` }`}>
                                        <div className="user-details">
                                            <div>
                                                <h2>{requestedUserData.displayName}</h2>
                                                <p> &#64;{requestedUserData.username}</p>
                                            </div>
                                            <div className="user-follower-count">
                                                <span onClick={() => handleUserFollowCountClick("following")}><span className="count">{requestedUserData.following.length}</span> following</span>
                                                <span onClick={() => handleUserFollowCountClick("followers")}><span className="count">{requestedUserData.followers.length}</span> followers</span>
                                            </div>
                                        </div>
                                        <div className="user-bio">{requestedUserData.about}</div>
                                    </div>
                                    {
                                        requestedUserData._id !== loggedInUser._id &&
                                        <button className="submit-btn follow-btn" onClick={handleFollowButtonClick}>
                                            {
                                                loading ? <span id="loading"></span> : <>
                                                    {isFollowing ? <CheckIcon className="follow-icon" /> : <PersonAddIcon className="follow-icon" />}
                                                    <span>{isFollowing ? "Following" : "Follow"}</span>
                                                </>
                                            }
                                        </button>
                                    }
                                </div>

                                <TweetNavigationSideBar
                                    userId={requestedUserData._id}
                                    loggedInUserId={loggedInUser._id}
                                    currentUserDisplayImage={requestedUserData.profilePhoto}
                                    loggedInUserDisplayImage={loggedInUser.profilePhoto}
                                    currentUserUsername={requestedUserData.username}
                                    loggedInUserUsername={loggedInUser.username}
                                    currentUserDisplayName={loggedInUser.displayName}
                                    categoryToGet={tweetCategory} 
                                    categoryLocation={tweetCategoryLocation}
                                    firstCategoryTitle="Tweets"
                                    firstCategory="tweets"
                                    secondCategoryTitle="Tweets & Replies" 
                                    secondCategory="tweets-and-replies" 
                                    thirdCategoryTitle="Media"
                                    thirdCategory="media"
                                    fourthCategoryTitle="Likes"
                                    fourthCategory="likes"
                                    handleTweetCategoryChange={handleTweetCategoryChange}
                                />

                                {
                                    isActive && 
                                    <UsersPopup
                                        userPopupRef={ref}
                                        user={requestedUserData}
                                        usersDataToShow={fetchedUsersData}
                                        fetchError={fetchUsersDataError}
                                        setActive={setActive}
                                        userSearchQuery={userSearchQuery}
                                        handleUserSearchInputChange={handleUserSearchInputChange}
                                        isSearchQueryEmpty={isSearchQueryEmpty}
                                        setUserSearchQuery={setUserSearchQuery}
                                        searchResults={searchResults}
                                        handleUserItemClick={handleUserItemClick}
                                        isUsersLoading={isUsersLoading}
                                    />
                                }
                            </>
                        }
                        
                    </div>
                </main>

                <MobileNavigationBar navigationRef={mobileNavRef} />

            </>
        }
    </>
}

export default UserProfilePage;
