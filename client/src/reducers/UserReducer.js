export const userReducerActions = {
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

export const userReducer = (currentState, action) => {
    switch (action.type) {
        case userReducerActions.updateDivActive:
            return { ...currentState, isActive: action.payload.value }
        case userReducerActions.updatePageLoading:
            return { ...currentState, pageLoading: action.payload.value }
        case userReducerActions.updateUserRegistered:
            return { ...currentState, isUserRegistered: action.payload.value }
        case userReducerActions.updateUserRequestedData:
            return { ...currentState, requestedUserData: action.payload.value }
        case userReducerActions.updateUserDetails:
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
        case userReducerActions.updateLoggedIn:
            return { ...currentState, isLoggedIn: action.payload.value }
        case userReducerActions.updateGroupsParameter:
            return { ...currentState, groupsParameterPassed: action.payload.value, settingsParameterPassed: action.payload.settingsParameterValue }
        case userReducerActions.updateSettingsParameter:
            return { ...currentState, settingsParameterPassed: action.payload.value, groupsParameterPassed: action.payload.groupsParameterValue }
        case userReducerActions.updateFollowing:
            return { ...currentState, isFollowing: action.payload.value }
        case userReducerActions.updateIsSearchQueryEmpty:
            return { ...currentState, isSearchQueryEmpty: action.payload.value }
        case userReducerActions.updateUserSearchQuery:
            return { ...currentState, userSearchQuery: action.payload.value }
        case userReducerActions.updateSearchResults:
            return { ...currentState, searchResults: action.payload.value }
        case userReducerActions.updateUserDetailsError:
            return { ...currentState, userDetailsError: action.payload.value }
        case userReducerActions.updateAllowClick:
            return { ...currentState, allowClick: action.payload.value }
        case userReducerActions.updateTweetCategory:
            return { ...currentState, tweetCategory: action.payload.value }
        case userReducerActions.updateTweetCategoryLocation:
            return { ...currentState, tweetCategoryLocation: action.payload.value }
        case userReducerActions.updateIsRequestLoading:
            return { ...currentState, isRequestLoading: action.payload.value }
        case userReducerActions.updateIsUsersLoading:
            return { ...currentState, isUsersLoading: action.payload.value }
        case userReducerActions.updateFetchedUsers:
            return { ...currentState, fetchedUsersData: action.payload.value }
        case userReducerActions.updateFetchUsersError:
            return { ...currentState, fetchUsersDataError: action.payload.value }
        case userReducerActions.updateUnreadMessages:
            return { ...currentState, unreadMessages: action.payload.value }
        default:
            return currentState;
    }
}
