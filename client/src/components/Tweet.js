import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import BookmarkBorderIcon from '@material-ui/icons/BookmarkBorder';
import PanoramaIcon from '@material-ui/icons/Panorama';
import SendIcon from '@material-ui/icons/Send';
import UserPicture from "../components/UserPicture";
import { Request } from "../requests/Request";
import { Formatter } from "../helpers/Formatter";
import React, { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { checkImageFile, checkIfItemInList, checkIfListIsEmpty } from '../validators/Validators';
import { useNavigate, useLocation } from 'react-router-dom';
import TweetSkeletonScreen from './TweetSkeletonScreen';
import UserItem from './UserItem';


const Tweet = (props) => {
    const navigate = useNavigate();
    const isSmallScreen = useMediaQuery({query: "(max-width: 767px)"});
    const [currentUserTweets, setCurrentUserTweets] = useState([]); // eslint-disable-line
    const [currentUserRetweets, setCurrentUserRetweets] = useState([]);
    const [currentUserLikedTweets, setCurrentUserLikedTweets] = useState([]);
    const [currentUserSavedTweets, setCurrentUserSavedTweets] = useState([]);
    const [tweets, setTweets] = useState([]);
    const [searchPeopleResults, setSearchPeopleResults] = useState([]);
    const [showPeopleResults, setShowPeopleResults] = useState(false);
    const [commentData, setCommentData] = useState({
        tweetId: "",
        author : props.currentUserDisplayName ? props.currentUserDisplayName: props.currentUserUsername,
        authorImage: props.loggedInUserDisplayImage ? props.loggedInUserDisplayImage : props.currentUserImage,
        authorUsername: props.loggedInUserUsername ? props.loggedInUserUsername : props.currentUserUsername,
        authorUserId: props.loggedInUserId ? props.loggedInUserId : props.userId,
        commentImage: "",
        commentText : "",
        action: "comment"
    });
    const commentImageFileRefs = useRef([]);
    const commentImagePreviewRefs = useRef([]);
    const commentUploadErrRefs = useRef([]);
    const commentImageIconRefs = useRef([]);
    const sendCommentRefs = useRef([]);
    const commentInputTextRefs = useRef([]);
    const retweetSpanCountRefs = useRef([]);
    const savedSpanCountRefs = useRef([]);
    const commentSpanRefs = useRef([]);
    const [currentTweetIndex, setCurrentTweetIndex] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const location = useLocation();
    const [tweetFetchError, setTweetFetchError] = useState("");

    useEffect(() => {
        if (!props.userId) return;

        setTweetFetchError(""); 

        // check if the user is trying to search for a tweet
        if (props.searchReceived){
            setTweets(props.searchTweetResults);
            setSearchPeopleResults(props.searchPeopleResults);
            
            // check if the user accounts were returned that matched the search query
            if (props.searchPeopleResults.length > 1) {
                setShowPeopleResults(true);
            }else{
                setShowPeopleResults(false);
            };

            setPageLoading(false);

            return
        }

        // handle route to a trend
        if (location.state){

            Request.makeGetRequest(`/users/${props.userId}/u/tweet/t/trends/${location.state.trendTag}`)
            .then(res => {
                setTweets(res.data.matchingTweets);
                setCurrentUserTweets(res.data.userTweets);
                setCurrentUserRetweets(res.data.userRetweets);
                setCurrentUserLikedTweets(res.data.userLikedTweets);
                setCurrentUserSavedTweets(res.data.userSavedTweets);
                
                setPageLoading(false);
                
            }).catch(err => {
                setPageLoading(false);
                setTweetFetchError("An error occured while trying to fetch the requested resource")
                console.log("An error occured while trying to fetch the resource")
            });

            return;
        }

        // show loading animation on category change
        if (props.tweetCategory) setPageLoading(true);

        Request.makeGetRequest(`/users/${props.userId}/tweet/${props.tweetType ? `${props.tweetType}/` : ""}${props.tweetCategory ? props.tweetCategory : ""}`)
        .then(res => {
            if(props.tweetCategory && props.tweetCategory === "people"){
                setShowPeopleResults(true);
                setSearchPeopleResults(res.data.users);
                setPageLoading(false);
                return;
            }
            
            setShowPeopleResults(false)

            setTweets(res.data.tweets);
            setCurrentUserTweets(res.data.userTweets);
            setCurrentUserRetweets(res.data.userRetweets);
            setCurrentUserLikedTweets(res.data.userLikedTweets);
            setCurrentUserSavedTweets(res.data.userSavedTweets);
            
            setPageLoading(false);
        }).catch( err => {
            setPageLoading(false);
            setTweetFetchError("An error occured while trying to fetch the requested resource")
            console.log("An error occured while trying to fetch the resource")
        });

        // checking if a new tweet was created and if so set the current user tweets to hold the updated list of tweets passed
        if (props.newTweetAdded) {
            setTweets(prevValue => {
                return [props.newTweetAdded, ...prevValue]
            });
        }

        
    }, [props.userId, props.tweetCategory, props.newTweetAdded, props.searchTweetResults, props.searchReceived, props.tweetType, props.searchPeopleResults, location.state]);


    // useEffect hook for adding a new comment to a tweet
    useEffect(() => {

        // if there is currently no text and image
        if ( commentData.commentText.length < 1 && commentData.commentImage === "" ) {
            
            // if either of the indexes do not exist
            if ( (!sendCommentRefs.current[currentTweetIndex]) || (!commentImageIconRefs.current[currentTweetIndex]) ) return;
        
            // removing the send icon and replacing it with the icon for uploading an image to a comment
            sendCommentRefs.current[currentTweetIndex].style.display = "none";
            commentImageIconRefs.current[currentTweetIndex].style.display = "block";

            return;
        };

        // if either of the indexes do not exist
        if ( (!sendCommentRefs.current[currentTweetIndex]) || (!commentImageIconRefs.current[currentTweetIndex]) ) return;
        
        // displaying the send icon and removing icon for uploading an image to a comment
        sendCommentRefs.current[currentTweetIndex].style.display = "block";
        commentImageIconRefs.current[currentTweetIndex].style.display = "none"
        

    }, [commentData.commentText, commentData.commentImage, currentTweetIndex]);


    // add an element to an array of refs
    const addToRefsArray = (elem, refArrayToAddTo) => {
        if (elem && !refArrayToAddTo.current.includes(elem)) refArrayToAddTo.current.push(elem);
    }
    
    // handle comment input change
    const handleCommentInputChange = (e, currentRefIndex, currentTweetId) => {
        const { name, value } = e.target;
        setCurrentTweetIndex(currentRefIndex);

        setCommentData(prevValue => {
            return {...prevValue, "tweetId": currentTweetId , [name]: value};
        });
    }

    // handle click on comment icon 
    const handleCommentImageIconClick = (commentImageFileRef, currentArrayIndex, currentTweetId) => {
        
        // checking if the reference to the image upload element is not null
        if (!commentImageFileRef) return;
        
        // opening up the 'Select File' dialog window and keeping track of the index of the 'commentImageFileRef' stored in the array of refs and the id of the current tweet selected
        commentImageFileRef.click();

        // updating the 'currentTweetIndex' and 'tweetId' in 'commentData' to keep track of the tweet selected
        setCurrentTweetIndex(currentArrayIndex);
        setCommentData(prevValue => {
            return {...prevValue, "tweetId": currentTweetId};
        })
    }

    // handle comment image load
    const handleCommentImageLoad = (e) => {
        if (e.target && e.target.files[0]){

            // checking if the tweet media file to be added is an image
            if (!checkImageFile(e.target.files[0].type)) {
                // displaying an error message and making the div containing it to be visible
                commentUploadErrRefs.current[currentTweetIndex].style.display = "block";
                
                // removing the error message and the div containing it after 4s
                setTimeout(() => commentUploadErrRefs.current[currentTweetIndex].style.display = "none", 4000);
                
                return;
            };

            // creating a new data url to let the user preview the comment image added to the tweet
            Formatter.convertFileObjectToImageStr(e.target.files[0]).then((resultingImageStr) => {
                
                commentImagePreviewRefs.current[currentTweetIndex].src = resultingImageStr;
                commentImagePreviewRefs.current[currentTweetIndex].style.display  = "block";

                setCommentData(prevValue => {
                    return {...prevValue, "commentImage": e.target.files[0]}
                });
           
            }).catch(err => {
                // displaying an error message and making the div containing it to be visible
                commentUploadErrRefs.current[currentTweetIndex].style.display = "block";
                
                // removing the error message and the div containing it after 4s
                setTimeout(() => commentUploadErrRefs.current[currentTweetIndex].style.display = "none", 4000);
                
            });

        }
    }

    // handle submitting of a new comment
    const handleSubmitCommentIconClick = () => {
        commentInputTextRefs.current[currentTweetIndex].value = "";

        setCommentData({
            commentText : "",
            tweetId: "",
            author : props.currentUserDisplayName ? props.currentUserDisplayName: props.currentUserUsername,
            authorImage: props.loggedInUserDisplayImage ? props.loggedInUserDisplayImage : props.currentUserImage,
            authorUsername: props.loggedInUserUsername ? props.loggedInUserUsername : props.currentUserUsername,
            authorUserId: props.loggedInUserId ? props.loggedInUserId : props.userId,
            commentImage: "",
            action: "comment"
        });
        
        Request.makePostRequest(`/users/${props.loggedInUserId ? props.loggedInUserId : props.userId}/tweet/${commentData.tweetId}/update`, commentData).then(res => {
            
            // updating the tweets
            setTweets(res.data.updatedTweets);

        }).catch(err => {

            // displaying an error message and making the div containing it to be visible
            commentUploadErrRefs.current[currentTweetIndex].innerText = err.response.data.error;
            commentUploadErrRefs.current[currentTweetIndex].style.display = "block";
                
            // removing the error message and the div containing it after 4s
            setTimeout(() => commentUploadErrRefs.current[currentTweetIndex].style.display = "none", 4000);
            
        })
    }

    // handle click on tweet actions(like, retweet, comment, save)
    const handleTweetActionClick = (tweetId, actionType, currentSpanIndex) => {
        setCurrentTweetIndex(currentSpanIndex);

        Request.makePostRequest(`/users/${props.loggedInUserId ? props.loggedInUserId : props.userId}/tweet/${tweetId}/update`, {action: actionType, currentUserDisplayName: props.currentUserDisplayName ? props.currentUserDisplayName: props.currentUserUsername}).then(res => {
            switch (actionType) {
                case "like":
                    setCurrentUserLikedTweets(res.data.updatedLikedTweets);
                    break;
                case "unlike":
                    setCurrentUserLikedTweets(res.data.updatedLikedTweets);
                    break;
                case "save":
                    setCurrentUserSavedTweets(res.data.updatedSavedTweets);
                    savedSpanCountRefs.current[currentTweetIndex].innerText = parseInt(savedSpanCountRefs.current[currentTweetIndex].innerText) + 1;
                    break;
                case "unsave":
                    setCurrentUserSavedTweets(res.data.updatedSavedTweets);
                    savedSpanCountRefs.current[currentTweetIndex].innerText = parseInt(savedSpanCountRefs.current[currentTweetIndex].innerText) - 1;
                    break;
                case "retweet":
                    setCurrentUserRetweets(res.data.updatedRetweets);
                    retweetSpanCountRefs.current[currentTweetIndex].innerText = parseInt(retweetSpanCountRefs.current[currentTweetIndex].innerText) + 1;
                    break;
                case "unretweet":
                    setCurrentUserRetweets(res.data.updatedRetweets);
                    retweetSpanCountRefs.current[currentTweetIndex].innerText = parseInt(retweetSpanCountRefs.current[currentTweetIndex].innerText) - 1;
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
        commentSpanRefs.current[index].classList.toggle("liked");
        commentSpanRefs.current[index].lastChild.textContent = actionType === "like-comment" ? "Liked" : "Like";

        Request.makePostRequest(`/users/${props.userId}/tweet/${tweetId}/update`, {action: actionType, commentId: commentId}).then(res => {
            setTweets(res.data.updatedTweets);
        }).catch(err => {
            console.log("An error occurred while trying to process your request");
        })
    }

    const createTweet = (tweet, index) => {
        if (Array.isArray(tweet) && tweet.length === 0) return <></>

        return (
        <div className="user-tweet-container" style={{ marginTop: tweet.retweetAuthor ? isSmallScreen ? "20%" : props.changeMargin ? "5.8%" : "7.8%" : ""}} >
            <div className="tweet-author-details-container">
                {tweet.retweetAuthor ? <span className="retweet-author-name"><AutorenewIcon className="autorenew-icon" />{tweet.retweetAuthor} Retweeted</span> : <></>}
                <UserPicture className="tweet-author-image" location={tweet.authorUsername} displayPicture={tweet.authorImage} />
                <div className="tweet-author-details">
                    <h4 style={{cursor: "pointer"}} onClick={() => { navigate(`/${tweet.authorUsername}`)} }>{tweet.author}</h4>
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
                <div className={`tweet-action-item ${checkIfItemInList(currentUserRetweets, tweet._id, "_id") ? "retweeted" : ""}`} onClick={() => handleTweetActionClick(tweet._id, checkIfItemInList(currentUserRetweets, tweet._id, "_id") ? "unretweet" : "retweet", index)}>
                    <AutorenewIcon />
                    {!isSmallScreen && <span>{checkIfItemInList(currentUserRetweets, tweet._id, "_id") ? "Retweeted" : "Retweet"}</span>}
                </div>
                <div className={`tweet-action-item ${checkIfItemInList(currentUserLikedTweets, tweet._id, "_id") ? "liked" : ""}`} onClick={() => handleTweetActionClick(tweet._id, checkIfItemInList(currentUserLikedTweets, tweet._id, "_id") ? "unlike" : "like", index)}>
                    <FavoriteBorderIcon />
                    {!isSmallScreen && <span>{checkIfItemInList(currentUserLikedTweets, tweet._id, "_id") ? "Liked" : "Like"}</span>}
                </div>
                <div className={`tweet-action-item ${checkIfItemInList(currentUserSavedTweets, tweet._id, "_id") ? "saved" : ""}`} onClick={() => handleTweetActionClick(tweet._id, checkIfItemInList(currentUserSavedTweets, tweet._id, "_id") ? "unsave" : "save", index)}>
                    <BookmarkBorderIcon />
                    {!isSmallScreen && <span>{checkIfItemInList(currentUserSavedTweets, tweet._id, "_id")? "Saved" : "Save"}</span>}
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
                                <h4 onClick={navigate(`/${comment.authorUsername}`)}>{comment.author}</h4>
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

        {pageLoading && <TweetSkeletonScreen className={`${props.searchPageActive ? "search-skeleton-screen" : ""}`} />}

        {
            !pageLoading && <>

                {   
                    tweetFetchError ? <div className="user-tweet-container empty-tweets">
                        <p className="empty-tweets-text">{tweetFetchError}</p>
                    </div> :
                    showPeopleResults ? React.Children.toArray(searchPeopleResults.map(searchResult => {
                        return <> 
                            <UserItem user={searchResult} handleUserItemClick={(...params) => {navigate(`/${params[1]}`)}} />
                        </>})
                    ) :
                    checkIfListIsEmpty(tweets) ? 
                    <div className="user-tweet-container empty-tweets">
                        <p className="empty-tweets-text">{props.searchReceived ? "No results found" : "No tweets to show yet"}</p>
                    </div> : 
                    React.Children.toArray(tweets.map(createTweet))
                }

            </>
        }
        
    </>
}

export default Tweet;
