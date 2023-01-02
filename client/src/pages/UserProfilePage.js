import { useEffect, useRef } from "react";
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
import { useUserContext } from "../contexts/UserContext";
import { userReducerActions } from "../reducers/UserReducer";


const UserProfilePage = ({ loggedInUser, updateCurrentUser, notSocialUser }) => {
    const requestedUser = useParams();
    const navBarRef = useRef(null);
    const mobileNavRef = useRef(null);
    const userPopupRef = useRef(null);
    
    const parameterPassed = window.location.search;
    const params = new URLSearchParams(parameterPassed);
    const query = params.get("tab");

    
    const { state, dispatch } =  useUserContext();
    
    const navigate = useNavigate()
    

    useTitle(`${requestedUser.user} | Tweeter`);
    useChangeElementPropertyOnScroll(navBarRef, "position", "fixed", "absolute");
    useChangeElementPropertyOnScroll(mobileNavRef, "display", "flex", "none");
    useClickOutside(userPopupRef, () => dispatch({ type: userReducerActions.updateDivActive, payload: { value: false } }));


    useEffect(() => {
        // making a get request to server to check if the requested username entered is registered
        Request.makeGetRequest(`/usernames/?username=${requestedUser.user}`).then(res => {
            
            // if the user does not exist
            if (!res.data.user[0]){
                dispatch({ type: userReducerActions.updatePageLoading, payload: { value: false } });
                dispatch({ type: userReducerActions.updateUserRegistered, payload: { value: false } });
                return;
            }

            // the user exists
            dispatch({ type: userReducerActions.updateUserRegistered, payload: { value: true } });
            dispatch({ type: userReducerActions.updateUserDetails, payload: 
                { 
                    value: {
                        displayName: loggedInUser.displayName,
                        username: loggedInUser.username,
                        userBio: loggedInUser.about
                    }
                } 
            });

            dispatch({ type: userReducerActions.updateUserRequestedData, payload: { value: res.data.user[0] } });
            dispatch({ type: userReducerActions.updatePageLoading, payload: { value: false } });
            
            return;

        }).catch(err => {
            console.log("An error occured while trying to connect to the server.");
            dispatch({ type: userReducerActions.updatePageLoading, payload: { value: false } });
        })

    }, [requestedUser.user, loggedInUser.username, loggedInUser.about, loggedInUser.displayName]);


    // 'useEffect' hook to check if there's a currently logged-in user
    useEffect(() => {
        if (loggedInUser !== "undefined"){ 
            dispatch({ type: userReducerActions.updateLoggedIn, payload: { value: true } });
            
            if (query) {
                if (query === "groups") return dispatch({ type: userReducerActions.updateGroupsParameter, payload: { value: true, settingsParameterValue: false } });
                if (query === "settings") return dispatch({ type: userReducerActions.updateSettingsParameter, payload: { value: true, groupsParameterValue: false } });
                
                return <PageNotFound user={loggedInUser} navigationBarReference={navBarRef} />
            };

            dispatch({ type: userReducerActions.updateGroupsParameter, payload: { value: false } });
            dispatch({ type: userReducerActions.updateSettingsParameter, payload: { value: false } });

            return;
        }

        dispatch({ type: userReducerActions.updateLoggedIn, payload: { value: false } });
        
    }, [loggedInUser, query]);


    // 'useEffect' hook to check if the logged-in user is following the user whose page is requested
    useEffect(() => {

        if((!state.requestedUserData) || (!loggedInUser)) return;

        const isUserAlreadyFollowingRequestedProfile = checkIfItemInList(state.requestedUserData.followers, loggedInUser._id);

        if (!isUserAlreadyFollowingRequestedProfile) return dispatch({ type: userReducerActions.updateFollowing, payload: { value: false } });

        dispatch({ type: userReducerActions.updateFollowing, payload: { value: true } });
        
    }, [state.requestedUserData, loggedInUser._id, loggedInUser]);


    // useEffect hook to monitor searching through either the user's following or followers
    useEffect(() => {
        if (state.userSearchQuery.length < 1) return dispatch({ type: userReducerActions.updateIsSearchQueryEmpty, payload: { value: true } });

        dispatch({ type: userReducerActions.updateIsSearchQueryEmpty, payload: { value: false }});
        
        dispatch( {type: userReducerActions.updateSearchResults, payload: { value: state.fetchedUsersData.filter(user => user.username.toLocaleLowerCase().includes(state.userSearchQuery.toLocaleLowerCase()) || user.displayName.toLocaleLowerCase().includes(state.userSearchQuery.toLocaleLowerCase())) } } );
        
    }, [state.userSearchQuery, state.fetchedUsersData]);


    // useEffect hook to monitor the username entered and validate that its not used by another user
    useEffect(() => {
        if (state.pageLoading) return;

        if (state.userDetails.username.length < 1 ) {
            dispatch({ type: userReducerActions.updateUserDetailsError, payload: { value: "Please enter a username" } });
            dispatch({ type: userReducerActions.updateAllowClick, payload: { value: false } });
            return;
        }

        // no spaces in username
        if(state.userDetails.username.includes(" ")) {
            dispatch({type: userReducerActions.updateUserDetailsError, payload: { value: "Please do not spaces in your username" }});
            dispatch({ type: userReducerActions.updateAllowClick, payload: { value: false }});
            return;
        }
        
        Request.makeGetRequest("/usernames").then(res => {
            const allUsernames = JSON.parse(CryptoJS.AES.decrypt(res.data.usernames, process.env.REACT_APP_AES_SECRET_KEY).toString(CryptoJS.enc.Utf8));        

            const usernameIsTaken = checkIfItemInList(allUsernames, state.userDetails.username, "username");
            
            if ( (state.userDetails.username !== loggedInUser.username) && (usernameIsTaken)) {
                dispatch({ type: userReducerActions.updateUserDetailsError, payload: { value: "Username already taken" }});
                dispatch({ type: userReducerActions.updateAllowClick, payload: { value: false }});
                return;
            };

            dispatch({ type: userReducerActions.updateAllowClick, payload: { value: true }});
            
        }).catch(err => {
            dispatch({ type: userReducerActions.updateUserDetailsError, payload: { value: "An error occurred while trying to fetch the requested resource." }});
        })
    
    }, [state.userDetails.username, loggedInUser.username, state.pageLoading])

    // useEffect hook to check if the current user has any unread messages
    useEffect(() => {
        Request.makeGetRequest(`/messages/${loggedInUser._id}`).then(res => {
            if(res.data.userMessages.map(messageItem => messageItem.messages.filter(message => message.status === "1")).flat().length >= 1 ) return dispatch({ type: userReducerActions.updateUnreadMessages, payload: { value: true }});

            dispatch({ type: userReducerActions.updateUnreadMessages, payload: { value: false } });

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
        dispatch({ type: userReducerActions.updateTweetCategory, payload: { value: category }});
        dispatch({ type: userReducerActions.updateTweetCategoryLocation, payload: { value: category.toLocaleLowerCase().replace(" ", "").replace(" ", "").replace("&", "+") }});
    };

    // handle click on follow button
    const handleFollowButtonClick = () => {
        if (state.isFollowing) return;

        dispatch({ type: userReducerActions.updateIsRequestLoading, payload: { value: true }});
        
        Request.makePostRequest(`/users/${loggedInUser._id}/follow/${state.requestedUserData._id}`)
        .then(res => {
            dispatch({ type: userReducerActions.updateIsRequestLoading, payload: { value: false }});
            updateCurrentUser(res.data.newFollower);
            dispatch({ type: userReducerActions.updateUserRequestedData, payload: { value: res.data.followedUser }});
        })
        .catch(err => {
            dispatch({ type: userReducerActions.updateIsRequestLoading, payload: { value: false }});
        });
    };

    // handle search input change
    const handleUserSearchInputChange = (e) => dispatch({ type: userReducerActions.updateUserSearchQuery, payload: { value: e.target.value } });

    // handle click on following or followers count span
    const handleUserFollowCountClick = (followerCategory) => {
        dispatch({ type: userReducerActions.updateDivActive, payload: { value: true }});
        
        Request.makeGetRequest(`/users/${state.requestedUserData._id}/${followerCategory}`)
        .then(res => {
            dispatch({ type: userReducerActions.updateIsUsersLoading, payload: { value: false }});
            
            dispatch({ type: userReducerActions.updateFetchedUsers, payload: { value: res.data[`${followerCategory}`] }})
        })
        .catch(err => {
            dispatch({ type: userReducerActions.updateIsUsersLoading, payload: { value: false }});
            
            dispatch({ type: userReducerActions.updateFetchUsersError, payload: { value: "An error occurred while trying to fetch the requested resource" }});
        });
    };

    // handle click on user item
    const handleUserItemClick = (...params) => {
        dispatch({ type: userReducerActions.updateDivActive, payload: { value: false }})
        navigate(`/${params[1]}`);
    }

    // handle change in user details
    const handleChangeInUserDetailsInput = (e) => {
        const { name, value } = e.target;
        dispatch({ type: userReducerActions.updateUserDetails, field: name, payload: { value: value }});
        
        if( name === "username" ) dispatch({ type: userReducerActions.updateUserDetailsError, payload: { value: "" }});
    }

    // handle update on user details
    const handleUserDetailsSubmitClick = (e) => {
        e.preventDefault();

        if (state.userDetails.username.length < 1) return dispatch({ type: userReducerActions.updateUserDetailsError, payload: { value: "Please enter a username" } });
        
        if (!state.allowClick) return;

        Request.makePatchRequest(`/users/${loggedInUser._id}`, state.userDetails).then(res => {
            
            updateCurrentUser(res.data.user);
            if (notSocialUser) localStorage.setItem("userData", JSON.stringify(res.data.user));
            navigate(-1);
        }).catch(err => {
            dispatch({ type: userReducerActions.updateUserDetailsError, payload: { value: err.response ? err.response.data.error : err.message }});
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
                                        dispatch({ type: userReducerActions.updateAllowClick, payload: { value: true } });
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
                                        setActive={(passedValue) => dispatch({ type: userReducerActions.updateDivActive, payload: { value: passedValue } })}
                                        userSearchQuery={state.userSearchQuery}
                                        handleUserSearchInputChange={handleUserSearchInputChange}
                                        isSearchQueryEmpty={state.isSearchQueryEmpty}
                                        setUserSearchQuery={ (valuePassed) => dispatch({ type: userReducerActions.updateUserSearchQuery, payload: { value: valuePassed } }) }
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
