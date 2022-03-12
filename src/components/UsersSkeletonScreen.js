const UsersSkeletonScreen = () => {
    return <>
        <div className="users-skeleton-screen">
            <div className="skeleton skeleton-search-bar"></div>
            <hr className="custom-hr"></hr>
            <div className="skeleton-user-details">
                <div className="skeleton skeleton-user-picture"></div>
                <div className="skeleton skeleton-user-info"></div>
            </div>
            <div className="skeleton-user-details">
                <div className="skeleton skeleton-user-picture"></div>
                <div className="skeleton skeleton-user-info"></div>
            </div>
            <div className="skeleton-user-details">
                <div className="skeleton skeleton-user-picture"></div>
                <div className="skeleton skeleton-user-info"></div>
            </div>
        </div>
    </>
}

export default UsersSkeletonScreen;
