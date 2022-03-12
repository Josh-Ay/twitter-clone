import UserPicture from './UserPicture';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import GroupIcon from '@material-ui/icons/Group';
import SettingsIcon from '@material-ui/icons/Settings';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { Request } from "../requests/Request";
import { useMediaQuery } from 'react-responsive';
import { useNavigate } from "react-router";
import { Link } from 'react-router-dom';

const UserProfileDropDown = (props) => {
    const smallScreen = useMediaQuery({query: "(max-width: 991px)"});
    const navigate = useNavigate();
    
    // handle click on logout option
    const handleLogout = (e) => {
        e.preventDefault();

        Request.makeGetRequestWithCredentials("/logout").then(res => {
            if (res.status !== 200) return;

            localStorage.clear();
            navigate("/login");

        }).catch(err => {
            console.log(err.message);
        })
    }

    return <div className="user-profile">
        <UserPicture displayPicture={props.profilePhoto} />
        {smallScreen ? "" : <span>{props.displayName}</span>}
        {props.removeDropDownIcon ? <span className="hidden-arrow"></span> : <ArrowDropDownIcon className="dropdown-icon" />}
        <ul className={`user-profile-options ${props.disableDropDown ? "disabled": ""} `}>
            <Link to={`/${props.username}`}><li className="user-profile-option-item"><AccountCircleIcon />My Profile</li></Link>
            <Link to={`/${props.username}?tab=groups`}><li className="user-profile-option-item"><GroupIcon /> Group Chat</li></Link>
            <Link to={`/${props.username}?tab=settings`}><li className="user-profile-option-item"><SettingsIcon /> Settings</li></Link>
            <hr className="custom-hr" />
            <Link to="/logout" onClick={handleLogout}><li className="user-profile-option-item"><ExitToAppIcon style={{color: "red"}} /> Logout</li></Link>
        </ul>
</div>
}

export default UserProfileDropDown;
