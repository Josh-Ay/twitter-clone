import UserPicture from "../components/UserPicture";
import PublicIcon from '@material-ui/icons/Public';
import PanoramaIcon from '@material-ui/icons/Panorama';
import PeopleIcon from '@material-ui/icons/People';
import LocalOfferIcon from '@material-ui/icons/LocalOffer';
import useClickOutside from "../hooks/useClickOutside";
import { useRef, useState } from 'react';
import { checkImageFile } from "../validators/Validators";
import { Formatter } from "../helpers/Formatter";

const NewTweet = ( {username, userPicture, tweet, updateTweetText, handleSubmit, updateTweetVisibility, handleImageUpload, showLoadingAnimation, tweetCreateError } ) => {
    const [ tweetVisibility, setTweetVisibility ] = useState("public");
    const [ tweetVisibiltyText, setTweetVisibilityText ] = useState("Everyone can reply");
    const ref = useRef(null);
    const ref2 = useRef(null);
    const imageUploadRef = useRef(null);
    const tweetMediaImgRef = useRef(null);
    const [ tweetImgUploadErrMsg, setTweetImgUploadErrMsg ] = useState(null);
    const [ isActive, setActive ] = useState(false);
    const [ showTagBox, setShowTagBox ] = useState(false);


    useClickOutside(ref, () => setActive(false));
    useClickOutside(ref2, () => setShowTagBox(false));


    const handleMouseClick = () => setActive(true);

    const resizeTextArea = (e) => {
        
        // getting the textarea element and its parent element too
        const textAreaElement = e.target;
        const parentElement = e.target.parentElement;

        // getting the css styles applied from the stylesheet(style.css)
        const textAreaCss = window.getComputedStyle(textAreaElement, null);
        const parentElementCss = window.getComputedStyle(parentElement, null);
        
        // getting the height of the textarea and parent elements respectively
        const initialTextareaHeight = Math.round( textAreaCss.height.replace("px", "") );
        const initialParentHeight = Math.round( parentElementCss.height.replace("px", "") )

        // checking if the textarea scrollHeight has changed due to overflowing content
        if (textAreaElement.scrollHeight > initialTextareaHeight){
            /* 
                changing the parent element height because the textarea takes 100% of the parent's height(from the css styles applied to it)
                so the parent's height would be adjusted to accomodate the change in textarea
            */
            parentElement.style.height = `${18 + initialParentHeight}px`;
        }
        
    }

    const handlePublicVisibilityClick = () => {
        setTweetVisibility("public");
        updateTweetVisibility("public");
        setTweetVisibilityText("Everyone can reply");
        setActive(false);
    };
    const handleFollowersVisibilityClick = () => {
        setTweetVisibility("followers");
        updateTweetVisibility("followers");
        setTweetVisibilityText("Only people you follow can reply");
        setActive(false);
    };

    const handleTagIconClick = () => setShowTagBox(true);

    // handle click on the panorama(image) icon to add an image to a new tweet
    const handleImageSelection = () => {
        // checking if the reference to the image upload element is null
        if (!imageUploadRef.current) return;

        // opening up the 'Select File' dialog window
        imageUploadRef.current.click();
    };

    // handle image addition to the new tweet
    const handleImageLoad = (e) => {
        if (e.target.files && e.target.files[0]){

            // checking if the tweet media file to be added is an image
            if (!checkImageFile(e.target.files[0].type)) {
                setTweetImgUploadErrMsg("Please select an image");
                setTimeout(() => setTweetImgUploadErrMsg(""), 3000);
                return;
            };

            // creating a new data url to let the user preview the image added to the new tweet
            Formatter.convertFileObjectToImageStr(e.target.files[0]).then((resultingImageStr) => {
                
                tweetMediaImgRef.current.src = resultingImageStr;
                tweetMediaImgRef.current.style.display = "block";

                handleImageUpload(e.target.files[0]);
           
            }).catch(err => {
                setTweetImgUploadErrMsg("An error occured while trying to load the image");
            });
            
        }
    }

    return <div className="new-tweet-container">
        <h5 className="new-tweet-title-text">Tweet Something</h5>
        <hr className="custom-hr" />
        
        {tweetCreateError && <div className="tweet-upload-error-msg">An error occured while trying to create your tweet. Please try again</div>}
        
        <div className="new-tweet-textarea">
            <UserPicture className="user-picture" location={username} displayPicture={userPicture}/>
            <textarea placeholder="What's happening?" name="tweetText" value={tweet.tweetText} onChange={updateTweetText} onKeyUp={resizeTextArea} autoFocus />
        </div>
        
        {tweetImgUploadErrMsg && <div className="tweet-upload-error-msg">{tweetImgUploadErrMsg}</div>}
        
        <img ref={tweetMediaImgRef} className="tweet-media-img" src="" alt="media of tweet"></img>
        
        <div className="new-tweet-settings-container">
            <div className="new-tweet-configure-container">
                <LocalOfferIcon onClick={handleTagIconClick} />
                <div className="new-tweet-select-media-container">
                    <label htmlFor="tweetMedia">Add Tweet Image</label>
                    <input aria-label="Add Tweet Image" id="tweetMedia" type="file" ref={imageUploadRef} onChange={handleImageLoad}></input>
                    
                    <PanoramaIcon onClick={handleImageSelection} />
                </div>
                {tweetVisibility === "public" && <PublicIcon className="tweet-visibility-indicator" onClick={handleMouseClick} />}
                {tweetVisibility === "followers" && <PeopleIcon className="tweet-visibility-indicator" onClick={handleMouseClick} />}
                <span className="tweet-visibility-indicator" onClick={handleMouseClick}>{tweetVisibiltyText}</span> 
            </div>
            {isActive && <div className="new-tweet-popup-container" ref={ref}>
                    <h5>Who can reply?</h5>
                    <span>Choose who can reply to this tweet</span>
                    <ul>
                        <li onClick={handlePublicVisibilityClick}><PublicIcon /><span>Everyone</span></li>
                        <li onClick={handleFollowersVisibilityClick}><PeopleIcon /><span>People you follow</span></li>
                    </ul>
                </div> 
            }
            {
                showTagBox && <div className="new-tweet-popup-container tags-popup" ref={ref2}>
                    <h5>Tags</h5>
                    <span>Enter tags (seperate with spaces)</span>
                    <input name="tags" onChange={updateTweetText} value={tweet.tags} />
                </div>
            }
            <button onClick={() => {handleSubmit(tweetMediaImgRef)}} className="submit-btn tweet-btn">{showLoadingAnimation ? <div id="loading"></div> : "Tweet"}</button>
        </div>
        
    </div>
}

export default NewTweet;
