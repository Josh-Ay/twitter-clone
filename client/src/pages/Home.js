import NavigationBar from "../components/NavigationBar";
import NewTweet from "../components/NewTweet";
import Tweet from "../components/Tweet";
import useTitle from "../hooks/useTitle";
import TweetTrends from "../components/TweetTrends";
import FollowerSuggestions from "../components/FollowerSuggestions";
import { Request } from "../requests/Request";
import { useEffect, useRef, useState } from "react";
import useOffsetFromElement from "../hooks/useOffsetFromElement";
import { useMediaQuery } from "react-responsive";
import useChangeElementPropertyOnScroll from "../hooks/useChangeElementPropertyOnScroll";
import MobileNavigationBar from "../components/MobileNavigationBar";


const Home = ( {user, updateCurrentUser} ) => {
    const [isNewTextEmpty, setNewTextEmpty] = useState(true);
    const isSmallScreen = useMediaQuery({query: "(max-width: 767px)"});
    const largeScreenNavRef = useRef(null);
    const homepageContainerRef = useRef(null);
    const mobileNavRef = useRef(null);

    const [newTweet, setNewTweet] = useState({
        author: user.displayName,
        authorImage: user.profilePhoto,
        authorUsername: user.username,
        tweetText: "",
        visibility: "public",
        imageFile: "",
        tags: ""
    });

    const [newTweetAdded, updateTweets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tweetCreateError, setTweetCreateError] = useState(null);
    const [unreadMessages, setUnreadMessages] = useState(false);
    
    useTitle("Tweeter");
    // useOffsetFromElement(largeScreenNavRef, homepageContainerRef, isSmallScreen ? 12 : "");
    useChangeElementPropertyOnScroll(largeScreenNavRef, "position", "fixed", "absolute");
    useChangeElementPropertyOnScroll(mobileNavRef, "display", "flex", "none");

    // useEffect hook to monitor changes in the text entered in the new tweet textarea
    useEffect(() => {
        if (newTweet.tweetText.length < 1) return setNewTextEmpty(true);

        setNewTextEmpty(false);
    }, [newTweet])


    // useEffect hook to check if the current user has any unread messages
    useEffect(() => {
        Request.makeGetRequest(`/messages/${user._id}`).then(res => {
            if(res.data.userMessages.map(messageItem => messageItem.messages.filter(message => message.status === "1")).flat().length >= 1 ) return setUnreadMessages(true);

            setUnreadMessages(false);

        }).catch(err => {
            console.log("An error occured while trying to fetch current user's messages")
        });
        
    }, [user._id])

    
    // handle input(for changes in new tweet textarea) change
    const handleChange = (e) => {
        const {name, value} = e.target;

        setNewTweet(prevValue => {
            return {
                ...prevValue, 
                [name]: value,
            }
        })
    };

    // handle change in tweet visibility selection
    const handleTweetVisibilityChange = (visibilitySetting) => {
        setNewTweet(prevValue => {
            return {...prevValue, "visibility": visibilitySetting}
        });
    };

    // handle image upload/addition
    const handleImageUpload = (imageFile) => {
        setNewTweet(prevValue => {
            return {...prevValue, "imageFile": imageFile};
        })
    }
    
    // handle new tweet submit
    const handleTweetSubmit = (tweetImagePreview) => {
        
        // disable tweet submit button click(not do anything) if there was no text or image entered in the new tweet
        if (isNewTextEmpty && newTweet.imageFile === "") return;

        // disable tweet submit button cilck(not do anything) if a new tweet is being added
        if (loading) return;

        // show loading animation
        setLoading(true);

        // creating a new form
        const formData = new FormData();

        // appending each key in the `newTweet` object to the new form created
        for (let key in newTweet) { formData.append(key, newTweet[key]) };

        // making a multipart post request to handle image uploads if any
        Request.makeMultipartPostRequest(`/users/${user._id}/tweet/`, formData)
        .then(res => {
            // updating the current user tweets
            updateTweets(res.data.newTweet);

            // remove loading animation
            setLoading(false);

            // reset the 'newTweet' state
            setNewTweet({
                author: user.displayName,
                authorImage: user.profilePhoto,
                authorUsername: user.username,
                tweetText: "",
                visibility: "public",
                imageFile: "",
                tags: ""
            });

            // remove the loaded tweet image preview
            tweetImagePreview.current.style.display = "none";

        }).catch(err => {
            // remove loading animation
            setLoading(false);

            // show an error message and remove after 3secs
            setTweetCreateError("An error occured while trying to create your tweet. Please try again 😶");
            setTimeout( () => setTweetCreateError(""), 3000 );    
        });
    };

    return <>
        <NavigationBar user={user} navigationBarReference={largeScreenNavRef} unreadMessagesIndicator={unreadMessages} />

        <main>
            <div className="main-container homepage-container" style={{ marginTop: "75px" }} ref={homepageContainerRef}>
                <NewTweet 
                    username={user.username}
                    userPicture={user.profilePhoto}
                    tweet={newTweet}
                    updateTweetText={handleChange}
                    updateTweetVisibility={handleTweetVisibilityChange}
                    handleSubmit={handleTweetSubmit}
                    handleImageUpload={handleImageUpload}
                    showLoadingAnimation={loading}
                    tweetCreateError={tweetCreateError}
                />

                <Tweet 
                    userId={user._id} 
                    newTweetAdded={newTweetAdded} 
                    currentUserImage={user.profilePhoto} 
                    currentUserUsername={user.username} 
                    currentUserDisplayName={user.displayName} 
                    changeMargin={true}
                />

                {
                    !isSmallScreen && 
                    <div className="side-div-container">
                        <TweetTrends userId={user._id} />
                        <FollowerSuggestions userId={user._id} updateCurrentUser={updateCurrentUser} />
                    </div>
                }
                
            </div>
        </main>

        <MobileNavigationBar navigationRef={mobileNavRef} unreadMessagesIndicator={unreadMessages} />
        
    </>
}

export default Home;
