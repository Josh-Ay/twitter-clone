const MessagesSkeletonContainer = () => {
    return <>
        <div className="messages-skeleton-container">
            <div className="skeleton messages-title"></div>
            <div className="skeleton current-user-messages">
                <div className="skeleton skeleton-user-picture"></div>
                <div className="skeleton skeleton-user-message-item"></div>
            </div>
            <div className="skeleton current-user-messages">
                <div className="skeleton skeleton-user-picture"></div>
                <div className="skeleton skeleton-user-message-item"></div>
            </div>
            <div className="skeleton current-user-messages">
                <div className="skeleton skeleton-user-picture"></div>
                <div className="skeleton skeleton-user-message-item"></div>
            </div>
            <div className="skeleton current-user-messages">
                <div className="skeleton skeleton-user-picture"></div>
                <div className="skeleton skeleton-user-message-item"></div>
            </div>
        </div>
    </>
}

export default MessagesSkeletonContainer;
