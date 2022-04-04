import { useEffect, useReducer, useRef } from "react";
import { useParams } from "react-router";
import { Request } from "../requests/Request";
import { checkIfItemInList } from "../validators/Validators";
import LoadingPage from "./LoadingPage";
import PageNotFound from "./PageNotFound";
import useTitle from "../hooks/useTitle";
import NavigationBar from "../components/NavigationBar";
import TweetNavigationSideBar from "../components/TweetNavigationSideBar";
import CryptoJS from "crypto-js";
import UserProfileForm from "../components/UserProfileForm";
import useChangeElementPropertyOnScroll from "../hooks/useChangeElementPropertyOnScroll";
import MobileNavigationBar from "../components/MobileNavigationBar";
import GroupsPage from "./GroupsPage";
import UsersPopup from "../components/UsersPopup";
import useClickOutside from "../hooks/useClickOutside";
import { useNavigate } from 'react-router';
import UserProfile from "../components/UserProfile";


require("dotenv").config();

const reducerActions = {
    updateDivActive: "update-div-active",
    updatePageLoading: "update-page-loading",
    updateUserRegistered: "update-user-registered",
    updateUserRequestedData: "update-requested-user-data",
    updateUserDetails: "update-user-details",
    updateLoggedIn: "update-logged-in",
    updateGroupsParameter: "update-groups-parameter",
    updateSettingsParameter: "update-settings-parameter",
    updateFollowing: "update-following",
    updateIsSearchQueryEmpty: "update-is-search-query-empty",
    updateUserSearchQuery: "update-user-search-query",
    updateSearchResults: "update-search-results",
    updateUserDetailsError: "update-user-details-error",
    updateAllowClick: "update-allow-click",
    updateTweetCategory: "update-tweet-category",
    updateTweetCategoryLocation: "update-tweet-category-location",
    updateIsRequestLoading: "update-is-request-loading",
    updateIsUsersLoading: "update-is-users-loading",
    updateFetchedUsers: "update-fetched-users",
    updateFetchUsersError: "update-fetch-users-error",
    updateUnreadMessages: "update-unread-messages"
}

const UserProfilePage = ({ loggedInUser, updateCurrentUser, notSocialUser }) => {
    const requestedUser = useParams();
    const navBarRef = useRef(null);
    const mobileNavRef = useRef(null);
    const userPopupRef = useRef(null);
    
    const parameterPassed = window.location.search;
    const params = new URLSearchParams(parameterPassed);
    const query = params.get("tab");

    const initialPageState = {
        isUserRegistered: null,
        requestedUserData: null,
        isLoggedIn: null,
        pageLoading: true,
        isRequestLoading: false,
        isFollowing: false,
        tweetCategory: "Tweets",
        tweetCategoryLocation: "tweets",
        settingsParameterPassed: false,
        groupsParameterPassed: false,
        allowClick: false,
        isActive: false,
        fetchedUsersData: [],
        searchResults: [],
        fetchUsersDataError: "",
        userSearchQuery: "",
        isSearchQueryEmpty: true,
        isUsersLoading: true,
        userDetails: {
            displayName: "",
            username: "",
            userBio: "",
            type: "update"
        },
        userDetailsError: "",
        unreadMessages: false,
    }


    const reducer = (currentState, action) => {
        switch (action.type) {
            case reducerActions.updateDivActive:
                return { ...currentState, isActive: action.payload.value }
            case reducerActions.updatePageLoading:
                return { ...currentState, pageLoading: action.payload.value }
            case reducerActions.updateUserRegistered:
                return { ...currentState, isUserRegistered: action.payload.value }
            case reducerActions.updateUserRequestedData:
                return { ...currentState, requestedUserData: action.payload.value }
            case reducerActions.updateUserDetails:
                if ( action.field ) return {
                    ...currentState, userDetails: 
                    { 
                        ...currentState.userDetails,
                        [ action.field ]: action.payload.value
                    }
                }
                return { ...currentState, userDetails: 
                    { 
                        ...currentState.userDetails, 
                        displayName: action.payload.value.displayName,
                        username: action.payload.value.username,
                        userBio: action.payload.value.userBio 
                    } 
                }
            case reducerActions.updateLoggedIn:
                return { ...currentState, isLoggedIn: action.payload.value }
            case reducerActions.updateGroupsParameter:
                return { ...currentState, groupsParameterPassed: action.payload.value, settingsParameterPassed: action.payload.settingsParameterValue }
            case reducerActions.updateSettingsParameter:
                return { ...currentState, settingsParameterPassed: action.payload.value, groupsParameterPassed: action.payload.groupsParameterValue }
            case reducerActions.updateFollowing:
                return { ...currentState, isFollowing: action.payload.value }
            case reducerActions.updateIsSearchQueryEmpty:
                return { ...currentState, isSearchQueryEmpty: action.payload.value }
            case reducerActions.updateUserSearchQuery:
                return { ...currentState, userSearchQuery: action.payload.value }
            case reducerActions.updateSearchResults:
                return { ...currentState, searchResults: action.payload.value }
            case reducerActions.updateUserDetailsError:
                return { ...currentState, userDetailsError: action.payload.value }
            case reducerActions.updateAllowClick:
                return { ...currentState, allowClick: action.payload.value }
            case reducerActions.updateTweetCategory:
                return { ...currentState, tweetCategory: action.payload.value }
            case reducerActions.updateTweetCategoryLocation:
                return { ...currentState, tweetCategoryLocation: action.payload.value }
            case reducerActions.updateIsRequestLoading:
                return { ...currentState, isRequestLoading: action.payload.value }
            case reducerActions.updateIsUsersLoading:
                return { ...currentState, isUsersLoading: action.payload.value }
            case reducerActions.updateFetchedUsers:
                return { ...currentState, fetchedUsersData: action.payload.value }
            case reducerActions.updateFetchUsersError:
                return { ...currentState, fetchUsersDataError: action.payload.value }
            case reducerActions.updateUnreadMessages:
                return { ...currentState, unreadMessages: action.payload.value }
            default:
                return currentState;
        }
    }

    const [state, dispatch] =  useReducer(reducer, initialPageState);
    
    const navigate = useNavigate()
    

    useTitle(`${requestedUser.user} | Tweeter`);
    useChangeElementPropertyOnScroll(navBarRef, "position", "fixed", "absolute");
    useChangeElementPropertyOnScroll(mobileNavRef, "display", "flex", "none");
    useClickOutside(userPopupRef, () => dispatch({ type: reducerActions.updateDivActive, payload: { value: false } }));


    useEffect(() => {
        // making a get request to server to check if the requested username entered is registered
        Request.makeGetRequest(`/usernames/?username=${requestedUser.user}`).then(res => {
            
            // if the user does not exist
            if (!res.data.user[0]){
                dispatch({ type: reducerActions.updatePageLoading, payload: { value: false } });
                dispatch({ type: reducerActions.updateUserRegistered, payload: { value: false } });
                return;
            }

            // the user exists
            dispatch({ type: reducerActions.updateUserRegistered, payload: { value: true } });
            dispatch({ type: reducerActions.updateUserDetails, payload: 
                { 
                    value: {
                        displayName: loggedInUser.displayName,
                        username: loggedInUser.username,
                        userBio: loggedInUser.about
                    }
                } 
            });

            dispatch({ type: reducerActions.updateUserRequestedData, payload: { value: res.data.user[0] } });
            dispatch({ type: reducerActions.updatePageLoading, payload: { value: false } });
            
            return;

        }).catch(err => {
            console.log("An error occured while trying to connect to the server.");
            dispatch({ type: reducerActions.updatePageLoading, payload: { value: false } });
        })
        
    }, [requestedUser.user, loggedInUser.username, loggedInUser.about, loggedInUser.displayName]);


    // 'useEffect' hook to check if there's a currently logged-in user
    useEffect(() => {
        if (loggedInUser !== "undefined"){ 
            dispatch({ type: reducerActions.updateLoggedIn, payload: { value: true } });
            
            if (query) {
                if (query === "groups") return dispatch({ type: reducerActions.updateGroupsParameter, payload: { value: true, settingsParameterValue: false } });
                if (query === "settings") return dispatch({ type: reducerActions.updateSettingsParameter, payload: { value: true, groupsParameterValue: false } });
                
                return <PageNotFound user={loggedInUser} navigationBarReference={navBarRef} />
            };

            dispatch({ type: reducerActions.updateGroupsParameter, payload: { value: false } });
            dispatch({ type: reducerActions.updateSettingsParameter, payload: { value: false } });

            return;
        }

        dispatch({ type: reducerActions.updateLoggedIn, payload: { value: false } });
        
    }, [loggedInUser, query]);


    // 'useEffect' hook to check if the logged-in user is following the user whose page is requested
    useEffect(() => {

        if((!state.requestedUserData) || (!loggedInUser)) return;

        const isUserAlreadyFollowingRequestedProfile = checkIfItemInList(state.requestedUserData.followers, loggedInUser._id, "_id");

        if (!isUserAlreadyFollowingRequestedProfile) return dispatch({ type: reducerActions.updateFollowing, payload: { value: false } });

        dispatch({ type: reducerActions.updateFollowing, payload: { value: true } });
        
    }, [state.requestedUserData, loggedInUser._id, loggedInUser]);


    // useEffect hook to monitor searching through either the user's following or followers
    useEffect(() => {
        if (state.userSearchQuery.length < 1) return dispatch({ type: reducerActions.updateIsSearchQueryEmpty, payload: { value: true } });

        dispatch({ type: reducerActions.updateIsSearchQueryEmpty, payload: { value: false }});
        
        dispatch( {type: reducerActions.updateSearchResults, payload: { value: state.fetchedUsersData.filter(user => user.username.toLocaleLowerCase().includes(state.userSearchQuery.toLocaleLowerCase()) || user.displayName.toLocaleLowerCase().includes(state.userSearchQuery.toLocaleLowerCase())) } } );
        
    }, [state.userSearchQuery, state.fetchedUsersData]);


    // useEffect hook to monitor the username entered and validate that its not used by another user
    useEffect(() => {
        if (state.pageLoading) return;

        if (state.userDetails.username.length < 1 ) {
            dispatch({ type: reducerActions.updateUserDetailsError, payload: { value: "Please enter a username" } });
            dispatch({ type: reducerActions.updateAllowClick, payload: { value: false } });
            return;
        }

        // no spaces in username
        if(state.userDetails.username.includes(" ")) {
            dispatch({type: reducerActions.updateUserDetailsError, payload: { value: "Please do not spaces in your username" }});
            dispatch({ type: reducerActions.updateAllowClick, payload: { value: false }});
            return;
        }
        
        if (state.userDetails.username === loggedInUser.username) return;
        
        Request.makeGetRequest("/usernames").then(res => {
            const allUsernames = JSON.parse(CryptoJS.AES.decrypt(res.data.usernames, process.env.REACT_APP_AES_SECRET_KEY).toString(CryptoJS.enc.Utf8));        

            const usernameIsTaken = checkIfItemInList(allUsernames, state.userDetails.username, "username");
            
            if ( (state.userDetails.username !== loggedInUser.username) && (usernameIsTaken)) {
                dispatch({ type: reducerActions.updateUserDetailsError, payload: { value: "Username already taken" }});
                dispatch({ type: reducerActions.updateAllowClick, payload: { value: false }});
                return;
            };

            dispatch({ type: reducerActions.updateAllowClick, payload: { value: true }});
            
        }).catch(err => {
            dispatch({ type: reducerActions.updateUserDetailsError, payload: { value: "An error occurred while trying to fetch the requested resource." }});
        })
    
    }, [state.userDetails.username, loggedInUser.username, state.pageLoading])

    // useEffect hook to check if the current user has any unread messages
    useEffect(() => {
        Request.makeGetRequest(`/messages/${loggedInUser._id}`).then(res => {
            if(res.data.userMessages.map(messageItem => messageItem.messages.filter(message => message.status === "1")).flat().length >= 1 ) return dispatch({ type: reducerActions.updateUnreadMessages, payload: { value: true }});

            dispatch({ type: reducerActions.updateUnreadMessages, payload: { value: false } });

        }).catch(err => {
            console.log("An error occured while trying to fetch current user's messages")
        });
        
    }, [loggedInUser._id])


    // checking if the requested username cannot be found
    if (!state.isUserRegistered && !state.pageLoading) {
        return <PageNotFound user={loggedInUser} navigationBarReference={navBarRef} />
    }

    // handle click on tweet category
    const handleTweetCategoryChange = (category) => {
        dispatch({ type: reducerActions.updateTweetCategory, payload: { value: category }});
        dispatch({ type: reducerActions.updateTweetCategoryLocation, payload: { value: category.toLocaleLowerCase().replace(" ", "").replace(" ", "").replace("&", "+") }});
    };

    // handle click on follow button
    const handleFollowButtonClick = () => {
        if (state.isFollowing) return;

        dispatch({ type: reducerActions.updateIsRequestLoading, payload: { value: true }});
        
        Request.makePostRequest(`/users/${loggedInUser._id}/follow/${state.requestedUserData._id}`)
        .then(res => {
            dispatch({ type: reducerActions.updateIsRequestLoading, payload: { value: false }});
            updateCurrentUser(res.data.newFollower);
            dispatch({ type: reducerActions.updateUserRequestedData, payload: { value: res.data.followedUser }});
        })
        .catch(err => {
            dispatch({ type: reducerActions.updateIsRequestLoading, payload: { value: false }});
        });
    };

    // handle search input change
    const handleUserSearchInputChange = (e) => dispatch({ type: reducerActions.updateUserSearchQuery, payload: { value: e.target.value } });

    // handle click on following or followers count span
    const handleUserFollowCountClick = (followerCategory) => {
        dispatch({ type: reducerActions.updateDivActive, payload: { value: true }});
        
        Request.makeGetRequest(`/users/${state.requestedUserData._id}/${followerCategory}`)
        .then(res => {
            dispatch({ type: reducerActions.updateIsUsersLoading, payload: { value: false }});
            
            dispatch({ type: reducerActions.updateFetchedUsers, payload: { value: res.data[`${followerCategory}`] }})
        })
        .catch(err => {
            dispatch({ type: reducerActions.updateIsUsersLoading, payload: { value: false }});
            
            dispatch({ type: reducerActions.updateFetchUsersError, payload: { value: "An error occurred while trying to fetch the requested resource" }});
        });
    };

    // handle click on user item
    const handleUserItemClick = (...params) => {
        dispatch({ type: reducerActions.updateDivActive, payload: { value: false }})
        navigate(`/${params[1]}`);
    }

    // handle change in user details
    const handleChangeInUserDetailsInput = (e) => {
        const { name, value } = e.target;
        dispatch({ type: reducerActions.updateUserDetails, field: name, payload: { value: value }});
        
        if( name === "username" ) dispatch({ type: reducerActions.updateUserDetailsError, payload: { value: "" }});
    }

    // handle update on user details
    const handleUserDetailsSubmitClick = (e) => {
        e.preventDefault();

        if (state.userDetails.username.length < 1) return dispatch({ type: reducerActions.updateUserDetailsError, payload: { value: "Please enter a username" } });
        
        if (!state.allowClick) return;

        Request.makePatchRequest(`/users/${loggedInUser._id}`, state.userDetails).then(res => {
            
            updateCurrentUser(res.data.user);
            if (notSocialUser) localStorage.setItem("userData", JSON.stringify(res.data.user));
            navigate(-1);
        }).catch(err => {
            dispatch({ type: reducerActions.updateUserDetailsError, payload: { value: err.response.data.error }});
        });

    }


    return <>
        {state.pageLoading && <LoadingPage />}

        {!state.pageLoading && 
            
            <>
                <NavigationBar user={state.isLoggedIn ? loggedInUser: ""} removeDropDownIcon={state.isLoggedIn && true} navigationBarReference={navBarRef} unreadMessagesIndicator={state.unreadMessages} />

                <main>
                    <div className="user-profile-page-container">
                        {
                            state.settingsParameterPassed && state.requestedUserData._id === loggedInUser._id &&
                            <UserProfileForm
                                user_id={loggedInUser._id}
                                title="Change Info"
                                profilePhoto={loggedInUser.profilePhoto}
                                coverPhoto={loggedInUser.coverPhoto}
                                displayName={state.userDetails.displayName}
                                username={state.userDetails.username}
                                bio={state.userDetails.userBio}
                                showCancelBtn={true}
                                allowClick={state.allowClick}
                                handleInputChange={handleChangeInUserDetailsInput}
                                errorMsg={state.userDetailsError}
                                handleSubmitClick={handleUserDetailsSubmitClick}
                                notSocialUser={notSocialUser}
                                updateCurrentUser={
                                    (userData) => {
                                        updateCurrentUser(userData);
                                        dispatch({ type: reducerActions.updateAllowClick, payload: { value: true } });
                                    }
                                }
                            />
                        }

                        {
                            state.groupsParameterPassed && state.requestedUserData._id === loggedInUser._id &&
                            <GroupsPage />
                        }
                        
                        {
                            !state.settingsParameterPassed && !state.groupsParameterPassed && state.requestedUserData && <>
                                <UserProfile
                                    userProfileToShow={state.requestedUserData}
                                    currentUser={loggedInUser}
                                    handleUserFollowCountClick={handleUserFollowCountClick}
                                    handleFollowButtonClick={handleFollowButtonClick}
                                    isFollowRequestLoading={state.isRequestLoading}
                                    isFollowingCurrentUserProfile={state.isFollowing}
                                />

                                <TweetNavigationSideBar
                                    userId={state.requestedUserData._id}
                                    loggedInUserId={loggedInUser._id}
                                    currentUserDisplayImage={state.requestedUserData.profilePhoto}
                                    loggedInUserDisplayImage={loggedInUser.profilePhoto}
                                    currentUserUsername={state.requestedUserData.username}
                                    loggedInUserUsername={loggedInUser.username}
                                    currentUserDisplayName={loggedInUser.displayName}
                                    categoryToGet={state.tweetCategory} 
                                    categoryLocation={state.tweetCategoryLocation}
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
                                    state.isActive && 
                                    <UsersPopup
                                        userPopupRef={userPopupRef}
                                        user={loggedInUser}
                                        usersDataToShow={state.fetchedUsersData}
                                        fetchError={state.fetchUsersDataError}
                                        setActive={(passedValue) => dispatch({ type: reducerActions.updateDivActive, payload: { value: passedValue } })}
                                        userSearchQuery={state.userSearchQuery}
                                        handleUserSearchInputChange={handleUserSearchInputChange}
                                        isSearchQueryEmpty={state.isSearchQueryEmpty}
                                        setUserSearchQuery={ (valuePassed) => dispatch({ type: reducerActions.updateUserSearchQuery, payload: { value: valuePassed } }) }
                                        searchResults={state.searchResults}
                                        handleUserItemClick={handleUserItemClick}
                                        isUsersLoading={state.isUsersLoading}
                                    />
                                }
                            </>
                        }
                        
                    </div>
                </main>

                <MobileNavigationBar navigationRef={mobileNavRef} unreadMessagesIndicator={state.unreadMessages} />

            </>
        }
    </>
}

export default UserProfilePage;
