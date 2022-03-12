import UserPicture from "../components/UserPicture";
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import { useMediaQuery } from "react-responsive";
import { Request } from "../requests/Request";
import React, { useEffect, useState } from "react";
import { Formatter } from "../helpers/Formatter";
import SuggestionsSkeletonContainer from "./SuggestionsSkeletonContainer";
import { useNavigate } from 'react-router-dom';
import { checkIfItemInList } from "../validators/Validators"


const FollowerSuggestions = ({ userId, updateCurrentUser }) => {
    const isMediumScreen = useMediaQuery({query: "(min-width: 768px) and (max-width: 991px)"});
    const [userFollowerSuggestions, setUserFollowerSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const navigate = useNavigate();

    // useEffect hook to fetch suggestions for the user
    useEffect(() => {

        Request.makeGetRequest(`/users/${userId}/user-suggestions`)
        .then(res => {
            setLoading(false);
            setUserFollowerSuggestions(res.data.followerSuggestions);
        })
        .catch(err => {
            console.log(err)
            setLoading(false);
        })

    }, [userId]);


    // handle following a user
    const handleFollowClick = (userToFollowId) => {
        setRequestLoading(true);

        Request.makePostRequest(`/users/${userId}/follow/${userToFollowId}`)
        .then(res => {
            setLoading(false);
            updateCurrentUser(res.data.newFollower);
        })
        .catch(err => {
            setLoading(false);
        });
    }

    const createUserFollowBox = (followerSuggestion) => {
        return (
            <>
                <hr className="custom-hr" />
                <div className="suggested-user-profile-container">
                    <div className="suggested-user-profile">
                        <UserPicture className="tweet-author-image" location={followerSuggestion.username} displayPicture={followerSuggestion.profilePhoto} />
                        <div className="suggested-user-profile-stats">
                            <h4 onClick={() => navigate(followerSuggestion.username)} className="username-title">{followerSuggestion.displayName ? followerSuggestion.displayName : followerSuggestion.username}</h4>
                            <span className="user-follower-stats">{Formatter.formatNumber(followerSuggestion.followers.length)} followers</span>
                        </div>
                        <button className="submit-btn large-follow-btn" onClick={() => handleFollowClick(followerSuggestion._id)}>
                            {
                                requestLoading ? <span id="loading"></span> :
                                checkIfItemInList(followerSuggestion.followers, userId, "_id") ?
                                <span>Following</span> : <>
                                    <PersonAddIcon className="follow-icon" />
                                    <span>Follow</span>
                                </>
                            }
                        </button>
                    </div>
                    <div className="suggested-user-bio">
                        <span>{followerSuggestion.about}</span>
                    </div>
                    <div className="suggested-user-cover-photo" style={{background: `${followerSuggestion.coverPhoto ? `url(${Formatter.formatImageStr(followerSuggestion.coverPhoto)})` : "url(assets/default-background-pic.jpg)"}`}}></div> 
                    {
                        isMediumScreen && <button className="submit-btn medium-follow-btn" onClick={() => handleFollowClick(followerSuggestion._id)}>
                            {
                                requestLoading ? <span id="loading"></span> :
                                checkIfItemInList(followerSuggestion.followers, userId, "_id") ?
                                <span>Following</span> : <>
                                    <PersonAddIcon className="follow-icon" />
                                    <span>Follow</span>
                                </>
                            }
                        </button>
                    }
                </div>
            </>
        )
    }
    
    return <>
    {
        loading ? <SuggestionsSkeletonContainer /> : userFollowerSuggestions.length > 0 && <div className="mini-container follower-suggestions-container">
        
            <h5 className="title-text">Who to follow</h5>

            {React.Children.toArray(userFollowerSuggestions.map(createUserFollowBox))}
            
        </div>
    }
    </>
}

export default FollowerSuggestions;