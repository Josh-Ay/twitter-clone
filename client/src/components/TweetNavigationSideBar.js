import Tweet from "./Tweet";
import SearchIcon from '@material-ui/icons/Search';
import { Request } from "../requests/Request";
import { useEffect, useState } from "react";

const TweetNavigationSideBar = (props) =>{
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchInputBoxEmpty, setSearchInputBoxEmpty] = useState(true);
    const [searchResults, setSearchResults] = useState([]);
    const [searchPeopleResults, setSearchPeopleResults] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const handleSearchInputChange = (e) => setSearchQuery(e.target.value);


    // useEffect hook to monitor changes in the search input bar
    useEffect( () => {
        if (searchQuery.length < 1) return setSearchInputBoxEmpty(true);
        
        setSearchInputBoxEmpty(false);

        Request.makeGetRequest(`/users/tweet/s/explore/${searchQuery}`).then(res => {
            setSearchResults(res.data.tweets);
            setSearchPeopleResults(res.data.users);
        }).catch(err => {
            console.log("An error occured while trying to fetch the resource")
            console.log(err);
        })

    }, [searchQuery]);


    // handle click on search button
    const handleSearchButtonClick = (e) => {
        setLoading(true);

        Request.makeGetRequest(`/users/tweet/s/explore/${searchQuery}`).then(res => {
            setLoading(false);
            setSearchResults(res.data.tweets);
            setSearchPeopleResults(res.data.users);
        }).catch(err => {
            setLoading(false);
            console.log("An error occured while trying to fetch the resource")
            console.log(err);
        })

    }

    return <>
        <div className="user-display-details-navigation-container">
            {/* EXPLORE PAGE(SMALL SCREENS ONLY) */}
            {
                props.showSearchBox && props.showSearchBoxForSmallScreen && <div className="search-box-container">
                    <SearchIcon className="search-icon" />
                    <label htmlFor="search">Search</label>
                    <input name="search" type="text" placeholder="Search" autoFocus id="search" aria-label="type to search" value={searchQuery} onChange={handleSearchInputChange} />
                    <button type="submit" onClick={(e) => handleSearchButtonClick(e) } >{loading ? <div id="loading"></div> : String.fromCharCode(62) }</button>
                </div>
            }
            
            <div className="user-navigation-tabs-container">
                <div className={`user-navigation-tab-item ${props.categoryToGet===props.firstCategoryTitle ? "active-tab-item" : ""}`} onClick={() => props.handleTweetCategoryChange(props.firstCategoryTitle)}>{props.firstCategoryTitle}</div>
                <div className={`user-navigation-tab-item ${props.categoryToGet===props.secondCategoryTitle ? "active-tab-item" : ""}`} onClick={() => props.handleTweetCategoryChange(props.secondCategoryTitle)}>{props.secondCategoryTitle}</div>
                <div className={`user-navigation-tab-item ${props.categoryToGet===props.thirdCategoryTitle ? "active-tab-item" : ""}`} onClick={() => props.handleTweetCategoryChange(props.thirdCategoryTitle)}>{props.thirdCategoryTitle}</div>
                <div className={`user-navigation-tab-item ${props.categoryToGet===props.fourthCategoryTitle ? "active-tab-item" : ""}`} onClick={() => props.handleTweetCategoryChange(props.fourthCategoryTitle)}>{props.fourthCategoryTitle}</div>
            </div>

            {/* PROFILE PAGE AND BOOKMARKS PAGE */}
            {
                !props.showSearchBox && 
                <div className="user-activity-details-container">
                    {
                        props.categoryToGet && 
                        <Tweet 
                            userId={props.userId} 
                            loggedInUserId={props.loggedInUserId} 
                            loggedInUserDisplayImage={props.loggedInUserDisplayImage} 
                            loggedInUserUsername={props.loggedInUserUsername} 
                            tweetCategory={props.categoryLocation} 
                            currentUserImage={props.currentUserDisplayImage} 
                            currentUserUsername={props.currentUserUsername} 
                            tweetType={props.tweetType}  
                            currentUserDisplayName={props.currentUserDisplayName} 
                        />
                    }
                </div>
            }
            
            {/* FOR EXPLORE PAGE */}
            {
                props.showSearchBox && 
                <div className="explore-trends-container">
                    {
                        !props.showSearchBoxForSmallScreen && <div className="search-box-container">
                            <SearchIcon className="search-icon" />
                            <label htmlFor="search">Search</label>
                            <input name="search" type="text" placeholder="Search" autoFocus id="search" aria-label="type to search" value={searchQuery} onChange={handleSearchInputChange} />
                            <button type="submit" onClick={handleSearchButtonClick} >Search</button>
                        </div>
                    }
                    <div className="user-activity-details-container">
                        {
                            !isSearchInputBoxEmpty && 
                            <Tweet 
                                userId={props.userId} 
                                searchReceived={!isSearchInputBoxEmpty} 
                                searchTweetResults={searchResults} 
                                searchPeopleResults={searchPeopleResults} 
                                currentUserImage={props.currentUserDisplayImage} 
                                currentUserUsername={props.currentUserUsername} 
                                searchPageActive={props.showSearchBox} 
                                currentUserDisplayName={props.currentUserDisplayName} 
                            />
                        }

                        {
                            props.categoryToGet && isSearchInputBoxEmpty && 
                            <Tweet 
                                userId={props.userId} 
                                tweetCategory={props.categoryLocation} 
                                currentUserImage={props.currentUserDisplayImage} 
                                currentUserUsername={props.currentUserUsername} 
                                tweetType="explore" 
                                searchPageActive={props.showSearchBox} 
                                currentUserDisplayName={props.currentUserDisplayName} 
                            />}
                    </div>
                </div>
            }

        </div>
    </>
}

export default TweetNavigationSideBar;
