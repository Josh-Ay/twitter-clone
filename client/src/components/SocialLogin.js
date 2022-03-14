require("dotenv").config();

const SocialLogin = (props) => {

    const handleClick = () => {
        // opening up a window to make the request
        window.open(`${process.env.REACT_APP_API_URL}${props.location}`, "_self");

    };
    
    return <div onClick={handleClick} className="social-icon-container" aria-label={props.ariaLabel} tabIndex="0">
        {props.icon}
    </div>
}

export default SocialLogin;