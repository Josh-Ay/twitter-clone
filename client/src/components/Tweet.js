import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import BookmarkBorderIcon from '@material-ui/icons/BookmarkBorder';
import PanoramaIcon from '@material-ui/icons/Panorama';
import SendIcon from '@material-ui/icons/Send';
import UserPicture from "../components/UserPicture";
import { Request } from "../requests/Request";
import { Formatter } from "../helpers/Formatter";
import React, { useEffect, useReducer, useRef } from "react";
import { useMediaQuery } from "react-responsive";
import { checkImageFile, checkIfItemInList, checkIfListIsEmpty } from '../validators/Validators';
import { useNavigate, useLocation } from 'react-router-dom';
import TweetSkeletonScreen from './TweetSkeletonScreen';
import UserItem from './UserItem';


const reducerActions = {
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


const Tweet = (props) => {
    const navigate = useNavigate();
    const isSmallScreen = useMediaQuery({query: "(max-width: 767px)"});

    const initialPageState = {
        currentUserTweets: [],
        currentUserRetweets: [],
        currentUserLikedTweets : [],
        currentUserSavedTweets: [],
        tweets: [],
        searchPeopleResults: [],
        showPeopleResults: false,
        commentData: {
            tweetId: "",
            author : props.currentUserDisplayName ? props.currentUserDisplayName: props.currentUserUsername,
            authorImage: props.loggedInUserDisplayImage ? props.loggedInUserDisplayImage : props.currentUserImage,
            authorUsername: props.loggedInUserUsername ? props.loggedInUserUsername : props.currentUserUsername,
            authorUserId: props.loggedInUserId ? props.loggedInUserId : props.userId,
            commentImage: "",
            commentText : "",
            action: "comment"
        },
        currentTweetIndex: null,
        pageLoading: true,
        tweetFetchError: ""
    }

    const reducer = (currentState, action) => {
        switch (action.type) {
            case reducerActions.updateTweetFetchError:
                return {...currentState, tweetFetchError: action.payload.value }
            case reducerActions.updateTweets:
                if (action.newTweet) return { ...currentState, tweets: [ action.payload.value, ...currentState.tweets ] }
                return { ...currentState, tweets: action.payload.value }
            case reducerActions.updateSearchPeopleResults:
                return { ...currentState, searchPeopleResults: action.payload.value }
            case reducerActions.updateShowPeopleResults:
                return { ...currentState, showPeopleResults: action.payload.value }
            case reducerActions.updatePageLoading:
                return { ...currentState, pageLoading: action.payload.value }
            case reducerActions.updateUserTweets:
                return { ...currentState, currentUserTweets: action.payload.value }
            case reducerActions.updateUserRetweets:
                return { ...currentState, currentUserRetweets: action.payload.value }
            case reducerActions.updateUserLikedTweets:
                return { ...currentState, currentUserLikedTweets: action.payload.value }
            case reducerActions.updateUserSavedTweets:
                return { ...currentState, currentUserSavedTweets: action.payload.value }
            case reducerActions.updateCurrentTweetIndex:
                return { ...currentState, currentTweetIndex: action.payload.value }                                                            
            case reducerActions.updateCommentData:
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

    const [state, dispatch] = useReducer(reducer, initialPageState);
    const commentImageFileRefs = useRef([]);
    const commentImagePreviewRefs = useRef([]);
    const commentUploadErrRefs = useRef([]);
    const commentImageIconRefs = useRef([]);
    const sendCommentRefs = useRef([]);
    const commentInputTextRefs = useRef([]);
    const retweetSpanCountRefs = useRef([]);
    const savedSpanCountRefs = useRef([]);
    const commentSpanRefs = useRef([]);
    const location = useLocation();
    
    useEffect(() => {
        if (!props.userId) return;

        dispatch({ type: reducerActions.updateTweetFetchError, payload: { value: "" } });

        // check if the user is trying to search for a tweet
        if (props.searchReceived){
            dispatch({ type: reducerActions.updateTweets, payload: { value: props.searchTweetResults } });
            dispatch({ type: reducerActions.updateSearchPeopleResults, payload: { value: props.searchPeopleResults } });
            
            // check if the user accounts were returned that matched the search query
            if (props.searchPeopleResults.length > 1) {
                dispatch({ type: reducerActions.updateShowPeopleResults, payload: { value: true } });
            }else{
                dispatch({ type: reducerActions.updateShowPeopleResults, payload: { value: false } });
            };

            dispatch({ type: reducerActions.updatePageLoading, payload: { value: false } });

            return
        }

        // handle route to a trend
        if (location.state){

            Request.makeGetRequest(`/users/${props.userId}/u/tweet/t/trends/${location.state.trendTag}`)
            .then(res => {
                dispatch({ type: reducerActions.updateTweets, payload: { value: res.data.matchingTweets } });
                dispatch({ type: reducerActions.updateUserTweets, payload: { value: res.data.userTweets } });
                dispatch({ type: reducerActions.updateUserRetweets, payload: { value: res.data.userRetweets } });
                dispatch({ type: reducerActions.updateUserLikedTweets, payload: { value: res.data.userLikedTweets } });
                dispatch({ type: reducerActions.updateUserSavedTweets, payload: { value: res.data.userSavedTweets } });
                
                dispatch({ type: reducerActions.updatePageLoading, payload: { value: false } });
                
            }).catch(err => {
                dispatch({ type: reducerActions.updatePageLoading, payload: { value: false } });
                
                dispatch({ type: reducerActions.updateTweetFetchError, payload: { value: "An error occured while trying to fetch the requested resource" } });
                console.log("An error occured while trying to fetch the resource")
            });

            return;
        }

        // show loading animation on category change
        if (props.tweetCategory) dispatch({ type: reducerActions.updatePageLoading, payload: { value: true } });;

        Request.makeGetRequest(`/users/${props.userId}/tweet/${props.tweetType ? `${props.tweetType}/` : ""}${props.tweetCategory ? props.tweetCategory : ""}`)
        .then(res => {
            if(props.tweetCategory && props.tweetCategory === "people"){
                dispatch({ type: reducerActions.updateShowPeopleResults, payload: { value: true } });
                dispatch({ type: reducerActions.updateSearchPeopleResults, payload: { value: res.data.users } });
                dispatch({ type: reducerActions.updatePageLoading, payload: { value: false } });
                return;
            }
            
            dispatch({ type: reducerActions.updateShowPeopleResults, payload: { value: false } });
            
            dispatch({ type: reducerActions.updateTweets, payload: { value: res.data.tweets } });
            dispatch({ type: reducerActions.updateUserTweets, payload: { value: res.data.userTweets } });
            dispatch({ type: reducerActions.updateUserRetweets, payload: { value: res.data.userRetweets } });
            dispatch({ type: reducerActions.updateUserLikedTweets, payload: { value: res.data.userLikedTweets } });
            dispatch({ type: reducerActions.updateUserSavedTweets, payload: { value: res.data.userSavedTweets } });
            
            dispatch({ type: reducerActions.updatePageLoading, payload: { value: false } });

        }).catch( err => {
            dispatch({ type: reducerActions.updatePageLoading, payload: { value: false } });
            dispatch({ type: reducerActions.updateTweetFetchError, payload: { value: "An error occured while trying to fetch the requested resource" } });
            console.log("An error occured while trying to fetch the resource")
        });

        // checking if a new tweet was created and if so set the current user tweets to hold the updated list of tweets passed
        if (props.newTweetAdded) {
            dispatch({ type: reducerActions.updateTweets, newTweet: true, payload: { value: props.newTweetAdded } });
        }

        
    }, [props.userId, props.tweetCategory, props.newTweetAdded, props.searchTweetResults, props.searchReceived, props.tweetType, props.searchPeopleResults, location.state]);


    // useEffect hook for adding a new comment to a tweet
    useEffect(() => {

        // if there is currently no text and image
        if ( state.commentData.commentText.length < 1 && state.commentData.commentImage === "" ) {
            
            // if either of the indexes do not exist
            if ( (!sendCommentRefs.current[state.currentTweetIndex]) || (!commentImageIconRefs.current[state.currentTweetIndex]) ) return;
        
            // removing the send icon and replacing it with the icon for uploading an image to a comment
            sendCommentRefs.current[state.currentTweetIndex].style.display = "none";
            commentImageIconRefs.current[state.currentTweetIndex].style.display = "block";

            return;
        };

        // if either of the indexes do not exist
        if ( (!sendCommentRefs.current[state.currentTweetIndex]) || (!commentImageIconRefs.current[state.currentTweetIndex]) ) return;
        
        // displaying the send icon and removing icon for uploading an image to a comment
        sendCommentRefs.current[state.currentTweetIndex].style.display = "block";
        commentImageIconRefs.current[state.currentTweetIndex].style.display = "none"
        

    }, [state.commentData.commentText, state.commentData.commentImage, state.currentTweetIndex]);


    // add an element to an array of refs
    const addToRefsArray = (elem, refArrayToAddTo) => {
        if (elem && !refArrayToAddTo.current.includes(elem)) refArrayToAddTo.current.push(elem);
    }
    
    // handle comment input change
    const handleCommentInputChange = (e, currentRefIndex, currentTweetId) => {
        const { name, value } = e.target;
        dispatch({ type: reducerActions.updateCurrentTweetIndex, payload: { value: currentRefIndex } });
        
        dispatch({ type: reducerActions.updateCommentData, objectField: "tweetId", inputField: name, payload: { objectFieldValue: currentTweetId, inputValue: value } });
    }

    // handle click on comment icon 
    const handleCommentImageIconClick = (commentImageFileRef, currentArrayIndex, currentTweetId) => {
        
        // checking if the reference to the image upload element is not null
        if (!commentImageFileRef) return;
        
        // opening up the 'Select File' dialog window and keeping track of the index of the 'commentImageFileRef' stored in the array of refs and the id of the current tweet selected
        commentImageFileRef.click();

        // updating the 'currentTweetIndex' and 'tweetId' in 'commentData' to keep track of the tweet selected
        dispatch({ type: reducerActions.updateCurrentTweetIndex, payload: { value: currentArrayIndex } });
        dispatch({ type: reducerActions.updateCommentData, objectField: "tweetId", payload: { objectFieldValue: currentTweetId } });
    }

    // handle comment image load
    const handleCommentImageLoad = (e) => {
        if (e.target && e.target.files[0]){

            // checking if the tweet media file to be added is an image
            if (!checkImageFile(e.target.files[0].type)) {
                // displaying an error message and making the div containing it to be visible
                commentUploadErrRefs.current[state.currentTweetIndex].style.display = "block";
                
                // removing the error message and the div containing it after 4s
                setTimeout(() => commentUploadErrRefs.current[state.currentTweetIndex].style.display = "none", 4000);
                
                return;
            };

            // creating a new data url to let the user preview the comment image added to the tweet
            Formatter.convertFileObjectToImageStr(e.target.files[0]).then((resultingImageStr) => {
                
                commentImagePreviewRefs.current[state.currentTweetIndex].src = resultingImageStr;
                commentImagePreviewRefs.current[state.currentTweetIndex].style.display  = "block";

                dispatch({ type: reducerActions.updateCommentData, objectField: "commentImage", payload: { objectFieldValue: e.target.files[0] } });
           
            }).catch(err => {
                // displaying an error message and making the div containing it to be visible
                commentUploadErrRefs.current[state.currentTweetIndex].style.display = "block";
                
                // removing the error message and the div containing it after 4s
                setTimeout(() => commentUploadErrRefs.current[state.currentTweetIndex].style.display = "none", 4000);
                
            });

        }
    }

    // handle submitting of a new comment
    const handleSubmitCommentIconClick = () => {
        commentInputTextRefs.current[state.currentTweetIndex].value = "";

        dispatch({ type: reducerActions.updateCommentData, payload: { value: 
            {
                commentText : "",
                tweetId: "",
                author : props.currentUserDisplayName ? props.currentUserDisplayName: props.currentUserUsername,
                authorImage: props.loggedInUserDisplayImage ? props.loggedInUserDisplayImage : props.currentUserImage,
                authorUsername: props.loggedInUserUsername ? props.loggedInUserUsername : props.currentUserUsername,
                authorUserId: props.loggedInUserId ? props.loggedInUserId : props.userId,
                commentImage: "",
                action: "comment"
            } 
        } });
        
        Request.makePostRequest(`/users/${props.loggedInUserId ? props.loggedInUserId : props.userId}/tweet/${state.commentData.tweetId}/update`, state.commentData).then(res => {
            
            // updating the tweets
            dispatch({ type: reducerActions.updateTweets, payload: { value: res.data.updatedTweets } });

        }).catch(err => {

            // displaying an error message and making the div containing it to be visible
            commentUploadErrRefs.current[state.currentTweetIndex].innerText = err.response.data.error;
            commentUploadErrRefs.current[state.currentTweetIndex].style.display = "block";
                
            // removing the error message and the div containing it after 4s
            setTimeout(() => commentUploadErrRefs.current[state.currentTweetIndex].style.display = "none", 4000);
            
        })
    }

    // handle click on tweet actions(like, retweet, comment, save)
    const handleTweetActionClick = (tweetId, actionType, currentSpanIndex) => {
        dispatch({ type: reducerActions.updateCurrentTweetIndex, payload: { value: currentSpanIndex } });
        
        Request.makePostRequest(`/users/${props.loggedInUserId ? props.loggedInUserId : props.userId}/tweet/${tweetId}/update`, {action: actionType, currentUserDisplayName: props.currentUserDisplayName ? props.currentUserDisplayName: props.currentUserUsername}).then(res => {
            switch (actionType) {
                case "like":
                    dispatch({ type: reducerActions.updateUserLikedTweets, payload: { value: res.data.updatedLikedTweets } });
                    break;
                case "unlike":
                    dispatch({ type: reducerActions.updateUserLikedTweets, payload: { value: res.data.updatedLikedTweets } });
                    break;
                case "save":
                    dispatch({ type: reducerActions.updateUserSavedTweets, payload: { value: res.data.updatedSavedTweets } });
                    savedSpanCountRefs.current[state.currentTweetIndex].innerText = parseInt(savedSpanCountRefs.current[state.currentTweetIndex].innerText) + 1;
                    break;
                case "unsave":
                    dispatch({ type: reducerActions.updateUserSavedTweets, payload: { value: res.data.updatedSavedTweets } });
                    savedSpanCountRefs.current[state.currentTweetIndex].innerText = parseInt(savedSpanCountRefs.current[state.currentTweetIndex].innerText) - 1;
                    break;
                case "retweet":
                    dispatch({ type: reducerActions.updateUserRetweets, payload: { value: res.data.updatedRetweets } });
                    retweetSpanCountRefs.current[state.currentTweetIndex].innerText = parseInt(retweetSpanCountRefs.current[state.currentTweetIndex].innerText) + 1;
                    break;
                case "unretweet":
                    dispatch({ type: reducerActions.updateUserRetweets, payload: { value: res.data.updatedRetweets } });
                    retweetSpanCountRefs.current[state.currentTweetIndex].innerText = parseInt(retweetSpanCountRefs.current[state.currentTweetIndex].innerText) - 1;
                    break;
                default:
                    break;
            }
        }).catch(err => {
            console.log("An error occurred while trying to process your request");
        })
    }

    // handle like on a comment
    const handleCommentActionClick = (commentId, tweetId, actionType, index) => {
        
        Request.makePostRequest(`/users/${props.userId}/tweet/${tweetId}/update`, {action: actionType, commentId: commentId}).then(res => {
            dispatch({ type: reducerActions.updateTweets, payload: { value: res.data.updatedTweets } });
        }).catch(err => {
            console.log("An error occurred while trying to process your request");
        })
    }

    const createTweet = (tweet, index) => {
        if (Array.isArray(tweet) && tweet.length === 0) return <></>

        return (
        <div className="user-tweet-container" style={{ marginTop: checkIfItemInList(state.currentUserRetweets, tweet._id, "_id") ? isSmallScreen ? "20%" : props.changeMargin ? "5.8%" : "7.8%" : ""}} >
            <div className="tweet-author-details-container">
                {checkIfItemInList(state.currentUserRetweets, tweet._id, "_id") ? <span className="retweet-author-name"><AutorenewIcon className="autorenew-icon" />{props.currentUserDisplayName ? props.currentUserDisplayName: props.currentUserUsername} Retweeted</span> : <></>}
                <UserPicture className="tweet-author-image" location={tweet.authorUsername} displayPicture={tweet.authorImage} />
                <div className="tweet-author-details">
                    <h4 style={{cursor: "pointer"}} onClick={() => { navigate(`/${tweet.authorUsername}`)} }>{tweet.author !== "undefined" ? tweet.author : tweet.authorUsername}</h4>
                    <span>{Formatter.formatDateTime(tweet.createdAt)}</span>
                </div>
            </div>
            <div className="tweet-contents-container">
                <span className="tweet-text" style={{whiteSpace: "pre-line"}}>{tweet.tweetText}</span>
                {
                    tweet.image && <figure>
                        <img src={Formatter.formatImageStr(tweet.image)} alt="media of tweet" />
                    </figure>
                }
            </div>
            <div className="tweet-reactions-container">
                <span>{Formatter.formatNumber(tweet.comments.length)} Comments</span>
                <span><span className="count" ref={elem => addToRefsArray(elem, retweetSpanCountRefs)}>{Formatter.formatNumber(tweet.retweets)}</span> Retweets</span>
                <span><span className="count" ref={elem => addToRefsArray(elem, savedSpanCountRefs)}>{Formatter.formatNumber(tweet.timesSaved)}</span> Saved</span>
            </div>
            <hr className="custom-hr"/>
            <div className="tweet-actions-container">
                <div className="tweet-action-item" onClick={() => commentInputTextRefs.current[index].focus()}>
                    <ChatBubbleOutlineIcon />
                    {!isSmallScreen && <span>Comment</span>}
                </div>
                <div className={`tweet-action-item ${checkIfItemInList(state.currentUserRetweets, tweet._id, "_id") ? "retweeted" : ""}`} onClick={() => handleTweetActionClick(tweet._id, checkIfItemInList(state.currentUserRetweets, tweet._id, "_id") ? "unretweet" : "retweet", index)}>
                    <AutorenewIcon />
                    {!isSmallScreen && <span>{checkIfItemInList(state.currentUserRetweets, tweet._id, "_id") ? "Retweeted" : "Retweet"}</span>}
                </div>
                <div className={`tweet-action-item ${checkIfItemInList(state.currentUserLikedTweets, tweet._id, "_id") ? "liked" : ""}`} onClick={() => handleTweetActionClick(tweet._id, checkIfItemInList(state.currentUserLikedTweets, tweet._id, "_id") ? "unlike" : "like", index)}>
                    <FavoriteBorderIcon />
                    {!isSmallScreen && <span>{checkIfItemInList(state.currentUserLikedTweets, tweet._id, "_id") ? "Liked" : "Like"}</span>}
                </div>
                <div className={`tweet-action-item ${checkIfItemInList(state.currentUserSavedTweets, tweet._id, "_id") ? "saved" : ""}`} onClick={() => handleTweetActionClick(tweet._id, checkIfItemInList(state.currentUserSavedTweets, tweet._id, "_id") ? "unsave" : "save", index)}>
                    <BookmarkBorderIcon />
                    {!isSmallScreen && <span>{checkIfItemInList(state.currentUserSavedTweets, tweet._id, "_id")? "Saved" : "Save"}</span>}
                </div>
            </div>
            <hr className="custom-hr"/>
            
            {/** ADD COMMENTS */}
            <div className="tweet-reply-container">
                <UserPicture className="tweet-author-image" location={props.loggedInUserUsername ? props.loggedInUserUsername : props.currentUserUsername} displayPicture={props.loggedInUserDisplayImage ? props.loggedInUserDisplayImage : props.currentUserImage} />
                <form onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() } } >
                    <input ref={elem => addToRefsArray(elem, commentInputTextRefs) } name="commentText" type="text" placeholder="Tweet your reply" onChange={(e) => handleCommentInputChange(e, index, tweet._id)} />
                    <div className="add-comment-image-container">
                        <input aria-label="Add Comment Image" ref={elem => addToRefsArray(elem, commentImageFileRefs)} type="file" onChange={handleCommentImageLoad}></input>    
                        <PanoramaIcon ref={elem => addToRefsArray(elem, commentImageIconRefs) } onClick={() => { handleCommentImageIconClick(commentImageFileRefs.current[index], index, tweet._id) }} className="reply-upload-img-icon" />
                    </div>
                </form>
            </div>
            
            {/**COMMENT IMAGE PREVIEW */}
            <img className="comment-media-image" ref={elem => addToRefsArray(elem, commentImagePreviewRefs)} src="" alt="comment media" />
            
            {/* COMMENT IMAGE UPLOAD ERROR DIV */}
            <div className="comment-error-message" ref={elem => addToRefsArray(elem, commentUploadErrRefs) }>Please Select an image</div>
            
            <SendIcon className="send-comment-icon" onClick={handleSubmitCommentIconClick} ref={elem => addToRefsArray(elem, sendCommentRefs)} />
                            
            {/** ALL COMMENTS */}
            <div className="user-replies-container">
                <hr className="custom-hr" />
                {tweet.comments.map(comment => {
                    return <div className="user-reply-item" key={comment._id}>
                        <UserPicture className="tweet-author-image" location={comment.authorUsername} displayPicture={comment.authorImage} />
                        <div className="user-reply-details-box">
                            <div className="user-reply-author">
                                <h4 onClick={() => navigate(`/${comment.authorUsername}`)}>{comment.author}</h4>
                                <span>{Formatter.formatDateTime(comment.createdAt)}</span>
                            </div>
                            <div className="user-reply">
                                <span style={{whiteSpace: "pre-line"}}>{comment.commentText}</span>
                            </div>
                        </div>
                        <div className="reply-reactions-container">
                            <span ref={elem => addToRefsArray(elem, commentSpanRefs)} className={`comment-reply-action ${checkIfItemInList(comment.usersThatLiked, props.userId) ? "liked" : ""}`} onClick={() => handleCommentActionClick(comment._id, tweet._id, checkIfItemInList(comment.usersThatLiked, props.userId) ? "unlike-comment" : "like-comment", index)}>
                                <FavoriteBorderIcon className="like-reply-icon" />
                                <>{checkIfItemInList(comment.usersThatLiked, props.userId) ? "Liked" : "Like"}</>
                            </span>
                            <span className="comment-separator-dot">.</span>
                            <span className="comment-reply-count">{Formatter.formatNumber(comment.likes)} Likes</span>
                        </div>
                    </div>
                })}
            </div>

        </div>
        )
    }


    return <>

        {state.pageLoading && <TweetSkeletonScreen className={`${props.searchPageActive ? "search-skeleton-screen" : ""}`} />}
        {
            !state.pageLoading && <>

                {   
                    state.tweetFetchError ? <div className="user-tweet-container empty-tweets">
                        <p className="empty-tweets-text">{state.tweetFetchError}</p>
                    </div> :
                    state.showPeopleResults ? React.Children.toArray(state.searchPeopleResults.map(searchResult => {
                        return <> 
                            <UserItem user={searchResult} handleUserItemClick={(...params) => {navigate(`/${params[1]}`)}} />
                        </>})
                    ) :
                    checkIfListIsEmpty(state.tweets) ? 
                    <div className="user-tweet-container empty-tweets">
                        <p className="empty-tweets-text">{props.searchReceived ? "No results found" : "No tweets to show yet"}</p>
                    </div> : 
                    React.Children.toArray(state.tweets.map(createTweet))
                }

            </>
        }
        
    </>
}

export default Tweet;
