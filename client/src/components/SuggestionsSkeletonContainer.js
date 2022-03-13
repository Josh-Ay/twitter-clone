const SuggestionsSkeletonContainer = () => {
    return <>
        <div className="suggestions-skeleton-screen">
            <div className="skeleton heading-title"></div>
            <hr className="custom-hr" />

            <div className="skeleton-user-profile-container">
                <div className="skeleton-user-details">
                    <div className="skeleton skeleton-author-image"></div>
                    <div className="skeleton-user-info">
                        <div className="skeleton skeleton-username"></div>
                        <div className="skeleton skeleton-user-follow-count"></div>
                    </div>
                    <div className="skeleton skeleton-follow-btn"></div>
                </div>
                <div className="skeleton-user-bio">
                    <div className="skeleton user-bio-line"></div>
                    <div className="skeleton user-bio-line"></div>
                </div>
                <div className="skeleton skeleton-user-cover-photo"></div>
            </div>
            
            <hr className="custom-hr"/>

            <div className="skeleton-user-profile-container">
                <div className="skeleton-user-details">
                    <div className="skeleton skeleton-author-image"></div>
                    <div className="skeleton-user-info">
                        <div className="skeleton skeleton-username"></div>
                        <div className="skeleton skeleton-user-follow-count"></div>
                    </div>
                    <div className="skeleton skeleton-follow-btn"></div>
                </div>
                <div className="skeleton-user-bio">
                    <div className="skeleton user-bio-line"></div>
                    <div className="skeleton user-bio-line"></div>
                </div>
                <div className="skeleton skeleton-user-cover-photo"></div>
            </div>
            
        </div> 
    </>
}

export default SuggestionsSkeletonContainer;