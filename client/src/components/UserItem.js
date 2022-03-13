import UserPicture from "./UserPicture"

const UserItem = ( { user, handleUserItemClick } ) => {
    return <div className="user-message-item" onClick={() => { handleUserItemClick(user.displayName ? user.displayName : user.username, user.username, user.userId, user.socketId) } }>
        <UserPicture 
            className="user-img"
            displayPicture={user.profilePhoto}
        />
        <div className="current-user-details">
            <div className="current-user-display-name">{user.displayName}</div>
            <div className="current-user-username">&#64;{user.username}</div>
        </div>
    </div>
}

export default UserItem;
