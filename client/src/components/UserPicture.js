import { useState } from "react";
import { useNavigate } from "react-router"
import { Formatter } from "../helpers/Formatter";


export default function UserPicture(props) {
    const navigate = useNavigate();
    const [hasImageLoaded, setHasImageLoaded] = useState(false);

    // handle click on user picture(route to the owner of the picture's page)
    const handleClick = () => {
        if (!props.location) return;
        
        navigate(`/${props.location}`);
    };

    // checking for when the image has loaded and updating the 'hasImageLoaded' state
    const handleImageLoad = () => setHasImageLoaded(true);

    return <img
        className={props.className ? `current-user-img-container ${props.className} ${hasImageLoaded ? "" : "skeleton overlay" }` : `current-user-img-container ${hasImageLoaded ? "" : "skeleton overlay" }`} 
        src={props.displayPicture ? Formatter.formatImageStr(props.displayPicture) : "/assets/blank-profile-picture.svg"} 
        alt="current user" style={{cursor: "pointer"}} onClick={handleClick}
        onLoad={handleImageLoad}
    />
}
