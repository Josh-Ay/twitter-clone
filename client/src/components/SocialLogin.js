const SocialLogin = (props) => {
    let newWindow = null;

    const handleClick = () => {
        
        // if the window object does not exist(is null) or if it exists but has been closed
        if (newWindow == null || newWindow.closed){
            // opening up a window to make the request
            newWindow = window.open(`${process.env.REACT_APP_API_URL}${props.location}`, "_self");
        }
        // if the window object exists and is already open, then switch focus to it
        else{
            // switching focus to the existing window
            newWindow.focus();
        }

    };
    
    return <div onClick={handleClick} className="social-icon-container" aria-label={props.ariaLabel} tabIndex="0">
        {props.icon}
    </div>
}

export default SocialLogin;