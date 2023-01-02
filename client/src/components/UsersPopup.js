import CloseIcon from '@material-ui/icons/Close';
import SearchIcon from "@material-ui/icons/Search";
import UserPicture from './UserPicture';
import { checkIfItemInList, checkIfListIsEmpty } from '../validators/Validators';
import React from 'react';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import UsersSkeletonScreen from './UsersSkeletonScreen';
import { Formatter } from '../helpers/Formatter';

const UsersPopup = ({userPopupRef, user, userSearchQuery, handleUserSearchInputChange, isSearchQueryEmpty, setUserSearchQuery, setActive, usersDataToShow, searchResults, handleUserItemClick, isUsersLoading, fetchError}) => {

    const createUser = (currentUser) => {
        return <> 
            <div className="users-detail-container" onClick={() => handleUserItemClick(currentUser.displayName ? currentUser.displayName : currentUser.username, currentUser.username, currentUser._id, currentUser.socketId) }>
        
                <div className="user-info-container">
                    <div className="user-details">
                        <UserPicture className="user-picture" />
                        <div className="user-info">
                            <span className="username-span">{currentUser.displayName ? currentUser.displayName : currentUser.username}</span>
                            <span className="follow-count-span">{Formatter.formatNumber(currentUser.followers.length)} followers</span>
                        </div>
                    </div>
                    {
                        currentUser._id === user._id ? <></> : 
                        <button className="follow-btn">
                            { 
                                checkIfItemInList(currentUser.followers, user._id) ? <span>Following</span> : 
                                <><PersonAddIcon className="follow-user-icon" /><span>Follow</span></>
                            }
                        </button>
                    }

                </div>
                
                <div className="user-about-container">
                    <span>{currentUser.about}</span>
                </div>
                    
            </div>

            <hr className="custom-hr"></hr>
        </>
    }


    return (
    <div className="show-users-container" ref={userPopupRef}>
        {
            isUsersLoading ? <UsersSkeletonScreen /> : 
            <>
            <div className="title-container">
                <div className="top-content">
                    <div className="search-users-container">
                        <SearchIcon className="search-icon" />
                        <label htmlFor="searchUsers">Search</label>
                        <input name="searchUsers" type="text" placeholder="Search..." id="searchUsers" aria-label="search for a user to start a conversation with" value={userSearchQuery} onChange={handleUserSearchInputChange} />
                        {!isSearchQueryEmpty && <CloseIcon className="close-icon" onClick={() => setUserSearchQuery("")} />}
                    </div>
                </div>
                <div className="close-icon" onClick={() => setActive(false)}>
                    <CloseIcon />
                </div>
            </div>
                        
            <hr className="custom-hr"></hr>

            {
                checkIfListIsEmpty(usersDataToShow) && isSearchQueryEmpty ? 
                <p className="getting-started-message"> People you follow will appear here.</p> : 
                React.Children.toArray(
                    isSearchQueryEmpty ? 
                    usersDataToShow.map(createUser) : checkIfListIsEmpty(searchResults) ? 
                    <p className="getting-started-message">No users found.</p> : searchResults.map(createUser)
                )
            }
            </>
        }

    </div>
    );
}

export default UsersPopup;