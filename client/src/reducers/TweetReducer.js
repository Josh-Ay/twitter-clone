export const tweetReducerActions = {
    updateUserTweets: "update-user-tweets",
    updateUserRetweets: "update-user-retweets",
    updateUserLikedTweets: "update-user-liked-tweets",
    updateUserSavedTweets: "update-user-saved-tweets",
    updateTweets: "update-tweets",
    updateSearchPeopleResults: "update-search-people-results",
    updateShowPeopleResults: "update-show-people-results",
    updateCommentData: "update-comment-data",
    updateCurrentTweetIndex: "update-current-tweet-index",
    updatePageLoading: "update-page-loading",
    updateTweetFetchError: "update-tweet-fetch-error",
}

export const tweetReducer = (currentState, action) => {
    switch (action.type) {
        case tweetReducerActions.updateTweetFetchError:
            return {...currentState, tweetFetchError: action.payload.value }
        case tweetReducerActions.updateTweets:
            if (action.newTweet) return { ...currentState, tweets: [ action.payload.value, ...currentState.tweets ] }
            return { ...currentState, tweets: action.payload.value }
        case tweetReducerActions.updateSearchPeopleResults:
            return { ...currentState, searchPeopleResults: action.payload.value }
        case tweetReducerActions.updateShowPeopleResults:
            return { ...currentState, showPeopleResults: action.payload.value }
        case tweetReducerActions.updatePageLoading:
            return { ...currentState, pageLoading: action.payload.value }
        case tweetReducerActions.updateUserTweets:
            return { ...currentState, currentUserTweets: action.payload.value }
        case tweetReducerActions.updateUserRetweets:
            return { ...currentState, currentUserRetweets: action.payload.value }
        case tweetReducerActions.updateUserLikedTweets:
            return { ...currentState, currentUserLikedTweets: action.payload.value }
        case tweetReducerActions.updateUserSavedTweets:
            return { ...currentState, currentUserSavedTweets: action.payload.value }
        case tweetReducerActions.updateCurrentTweetIndex:
            return { ...currentState, currentTweetIndex: action.payload.value }                                                            
        case tweetReducerActions.updateCommentData:
            if ( !action.objectField ){
                return { ...currentState, commentData: action.payload.value }
            }
            return { ...currentState, commentData: {
                ...currentState.commentData,
                [ action.objectField ]: action.payload.objectFieldValue,
                [ action.inputField ]: action.payload.inputValue
            } }
        default:
            return currentState;
    }
}