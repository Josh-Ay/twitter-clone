import UserPicture from "./UserPicture";
import { Formatter } from "../helpers/Formatter";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import CheckIcon from "@material-ui/icons/Check";


const UserProfile = ({ userProfileToShow, currentUser, handleUserFollowCountClick, handleFollowButtonClick, isFollowRequestLoading, isFollowingCurrentUserProfile }) => {
    return <>
        <div className="user-profile-cover-photo" style={{background: `${userProfileToShow.coverPhoto ? `url(${Formatter.formatImageStr(userProfileToShow.coverPhoto)})` : "url(/assets/default-background-pic.jpg)"}`}} ></div>
        <div className="user-display-details-container">
            <div className="user-picture-canvas"></div>
            <UserPicture displayPicture={userProfileToShow.profilePhoto} />
            <div className={`user-display-details ${`${userProfileToShow._id === currentUser._id ? "current-user" : ""}` }`}>
                <div className="user-details">
                    <div>
                        <h2>{userProfileToShow.displayName}</h2>
                        <p> &#64;{userProfileToShow.username}</p>
                    </div>
                    <div className="user-follower-count">
                        <span onClick={() => handleUserFollowCountClick("following")}><span className="count">{userProfileToShow.following.length}</span> following</span>
                        <span onClick={() => handleUserFollowCountClick("followers")}><span className="count">{userProfileToShow.followers.length}</span> followers</span>
                    </div>
                </div>
                <div className="user-bio">{userProfileToShow.about}</div>
            </div>
            {
                userProfileToShow._id !== currentUser._id &&
                <button className="submit-btn follow-btn" onClick={handleFollowButtonClick}>
                    {
                        isFollowRequestLoading ? <span id="loading"></span> : <>
                            {isFollowingCurrentUserProfile ? <CheckIcon className="follow-icon" /> : <PersonAddIcon className="follow-icon" />}
                            <span>{isFollowingCurrentUserProfile ? "Following" : "Follow"}</span>
                        </>
                    }
                </button>
            }
        </div>
    </>
}

export default UserProfile;
