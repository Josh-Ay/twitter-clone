import NavigationBar from "../components/NavigationBar";
import UserProfileForm from "../components/UserProfileForm";
import MobileNavigationBar from "../components/MobileNavigationBar";
import LoadingPage from "./LoadingPage";
import { checkIfItemInList } from "../validators/Validators";
import { Request } from "../requests/Request";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import CryptoJS from "crypto-js";
import useTitle from "../hooks/useTitle";


const NewUser = ({ user, updateCurrentUser, notSocialUser }) => {
    useTitle("Tweeter | Set Up Profile");

    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setLoading] = useState(true);

    // if no state was passed(the user manually entered the address in the address bar)
    useEffect(() => {
        if (!location.state){ 
            setLoading(false);
            navigate("/");
            return;
        };

        setLoading(false);
    }, [navigate, location.state]);

    const [errorMessage, setErrorMessage] = useState("");
    const [allowClick, setAllowClick] = useState(false);
    const [userDetails, setUserDetails] = useState({
        username: "",
        userBio: "",
        displayName: ""
    });
    

    // handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserDetails(prevValue => {
            return {...prevValue, [name]: value};
        });
        if( name === "username") setErrorMessage("");
    }

    // handle submit click
    const handleSubmitClick = (e) => {
        e.preventDefault();

        if (userDetails.displayName.length < 1) return setErrorMessage("Please enter your name");
        
        if (userDetails.username.length < 1) return setErrorMessage("Please enter a username");
        
        if (!allowClick) return;

        Request.makePatchRequest(`/users/${user._id}`, userDetails).then(res => {
            if (res.status === 200){
                updateCurrentUser(res.data.user);

                // updating the user data stored in local storage for non-oauth users
                if (notSocialUser) localStorage.setItem("userData", JSON.stringify(res.data.user));
                navigate("/");
            }
        }).catch(err => {
            setErrorMessage(err.response ? err.response.data.error : err.message);
        });
    }

    // useEffect hook to monitor the username entered and validate that its not used by another user
    useEffect(() => {
        if (userDetails.username.length < 1) {
            setErrorMessage("");
            setAllowClick(false);
            return
        }

        // monitoring for spaces in username
        if (userDetails.username.includes(" ")){
            setErrorMessage("Please do not include spaces in your username");
            setAllowClick(false);
            return;
        }
        
        Request.makeGetRequest("/usernames").then(res => {
            const bytes  = CryptoJS.AES.decrypt(res.data.usernames, process.env.REACT_APP_AES_SECRET_KEY);
            const allUsernames = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));        

            const usernameIsTaken = checkIfItemInList(allUsernames, userDetails.username, "username");
            
            if (usernameIsTaken) {
                setErrorMessage("Username already taken");
                setAllowClick(false);
                return;
            };

            setAllowClick(true);

        }).catch(err => {
            setErrorMessage(err.response ? err.response.data.error : err.message);
        })
    
    }, [userDetails.username])

    // when the page is loading
    if(isLoading){
        return (
          <LoadingPage />
        );
    }

    return (
    isLoading ? <LoadingPage /> :
    <div className="new-user-container">
        <NavigationBar user={user} disableDropDown={true} disableNavLinks={true} />
        <main>
            <UserProfileForm
                user_id={user._id}
                title="Setup your profile" 
                displayName={userDetails.displayName}
                displayNamePlaceholder="Enter your full name..."
                username={userDetails.username}
                usernamePlaceholder="Enter your username..."
                userBio={userDetails.userBio}
                bioPlaceholder="Enter your bio..."
                handleInputChange={handleInputChange}
                handleSubmitClick={handleSubmitClick}
                errorMsg={errorMessage}
                allowClick={allowClick}
                updateCurrentUser={(userData) => updateCurrentUser(userData)} 
            />
        </main>
        <MobileNavigationBar />
    </div>
    )
}

export default NewUser;