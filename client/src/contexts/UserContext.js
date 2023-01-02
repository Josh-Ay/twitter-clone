import { createContext, useContext, useReducer } from "react";
import { userReducer } from "../reducers/UserReducer";

const UserContext = createContext({});

const initialState = {
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

export const useUserContext = () => useContext(UserContext);

export const UserContextProvider = ({ children }) => {

    const [state, dispatch] =  useReducer(userReducer, initialState);

    return (
        <UserContext.Provider value={{ state, dispatch }}>
            {children}
        </UserContext.Provider>
    )
}
