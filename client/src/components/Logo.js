import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";

const Logo = ({ disableClick }) => {
    const userPrefersDarkTheme = useMediaQuery({query: "(prefers-color-scheme: dark)"});
    const smallScreen = useMediaQuery({query: "(max-width: 767px)"});
    const navigate = useNavigate();

    // handle click on the tweeter logo
    const handleClick = () => {
        if (disableClick) return;

        navigate("/");
    };

    return <img src={smallScreen ? "/assets/tweeter-small.svg" :  userPrefersDarkTheme ? "/assets/tweeter-light.svg": "/assets/tweeter.svg" } 
    alt="tweeter icon" tabIndex="0" onClick={handleClick} className="logo-img"/>
}

export default Logo;