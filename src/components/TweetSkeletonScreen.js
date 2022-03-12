const TweetSkeletonScreen = ( { className } ) => {
    return <>
        <div className={`tweet-skeleton-screen ss-1 ${className ? `${className}` : "" }`}>
            <div className="skeleton-author-details">
                <div className="skeleton skeleton-author-image"></div>
                <div className="skeleton-author-container">
                    <div className="skeleton skeleton-author-name"></div>
                    <div className="skeleton skeleton-post-time"></div>
                </div>
            </div>
            <div className="skeleton skeleton-post-caption"></div>
            <div className="skeleton skeleton-stats-container"></div>
            <div className="skeleton-reactions-container">
                <div className="skeleton skeleton-reaction-item"></div>
                <div className="skeleton skeleton-reaction-item"></div>
                <div className="skeleton skeleton-reaction-item"></div>
                <div className="skeleton skeleton-reaction-item"></div>
            </div>
            <div className="skeleton-actions-container">
                <div className="skeleton skeleton-author-image"></div>
                <div className="skeleton skeleton-author-action"></div>
            </div>
        </div>

        <div className={`tweet-skeleton-screen ss-2 ${className ? `${className}` : "" }`}>
            <div className="skeleton-author-details">
                <div className="skeleton skeleton-author-image"></div>
                <div className="skeleton-author-container">
                    <div className="skeleton skeleton-author-name"></div>
                    <div className="skeleton skeleton-post-time"></div>
                </div>
            </div>
            <div className="skeleton skeleton-post-caption"></div>
            <div className="skeleton skeleton-post-image"></div>
            <div className="skeleton skeleton-stats-container"></div>
            <div className="skeleton-reactions-container">
                <div className="skeleton skeleton-reaction-item"></div>
                <div className="skeleton skeleton-reaction-item"></div>
                <div className="skeleton skeleton-reaction-item"></div>
                <div className="skeleton skeleton-reaction-item"></div>
            </div>
            <div className="skeleton-actions-container">
                <div className="skeleton skeleton-author-image"></div>
                <div className="skeleton skeleton-author-action"></div>
            </div>
        </div>

        <div className={`tweet-skeleton-screen ss-2 ${className ? `${className}` : "" }`}>
            <div className="skeleton-author-details">
                <div className="skeleton skeleton-author-image"></div>
                <div className="skeleton-author-container">
                    <div className="skeleton skeleton-author-name"></div>
                    <div className="skeleton skeleton-post-time"></div>
                </div>
            </div>
            <div className="skeleton skeleton-post-caption"></div>
            <div className="skeleton skeleton-post-image"></div>
            <div className="skeleton skeleton-stats-container"></div>
            <div className="skeleton-reactions-container">
                <div className="skeleton skeleton-reaction-item"></div>
                <div className="skeleton skeleton-reaction-item"></div>
                <div className="skeleton skeleton-reaction-item"></div>
                <div className="skeleton skeleton-reaction-item"></div>
            </div>
            <div className="skeleton-actions-container">
                <div className="skeleton skeleton-author-image"></div>
                <div className="skeleton skeleton-author-action"></div>
            </div>
        </div>
    </>
}

export default TweetSkeletonScreen;
