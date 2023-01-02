import { useEffect, useState } from "react";
import Logo from "../components/Logo";
import AuthenticationForm from "../components/AuthenticationForm";
import SocialLogin from "../components/SocialLogin";
import RerouteFooter from "../components/RerouteFooter";
import { validateEmail, checkIfItemInList } from '../validators/Validators';
import { Request } from "../requests/Request";
import useTitle from "../hooks/useTitle";
import GoogleIcon from '@material-ui/icons/Google';
import FacebookIcon from '@material-ui/icons/Facebook';
import GitHubIcon from '@material-ui/icons/GitHub';
import CryptoJS from "crypto-js";
import { useNavigate } from "react-router";


const SignUp = ( { setCurrentUser, socketInstance } ) => {
    useTitle("Tweeter | Sign Up");

    const [user, setUser] = useState({ email: "", password: "", socketId: "" });
    const [invalidEmail, setInvalidEmail] = useState(false);
    const [validationError, setValidationError] = useState(false);
    const [validationErrMessage, setValidationErrMessage] = useState("");
    const [allowClick, setAllowClick] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();


    // handle sign up button click
    const handleClick = (e) =>{
        e.preventDefault();

        if (!allowClick) return;
        
        setLoading(true);
        setAllowClick(false);
        
        // only register new user if register button click is allowed(i.e, if there were no validation errors)
        Request.makePostRequest("/signup", user).then(res => {
            setLoading(false);
            setCurrentUser(res.data.user);
            localStorage.setItem("userData", JSON.stringify(res.data.user));
            setAllowClick(true);
            navigate("/configure-profile", {state: {message: "ok"}});
        }).catch(err => { 
            setLoading(false);
            setValidationError(true);
            setValidationErrMessage(err.response ? err.response.data.error : err.message);
            setAllowClick(true);
        });
    };

    // handle input change
    const handleChange = (e) => {
        const {name, value} = e.target;
        setUser(prevValue => { 
            return {
                ...prevValue, 
                [name]: value, 
                "socketId": socketInstance.id 
            }; 
        });

        if (name === "email"){ setValidationError(false); };
    }

    // useEffect hook to monitor changes in the email entered
    useEffect(()=>{
        if (user.email.length < 1) return setInvalidEmail(false);

        // checking if the email entered by the user is valid on email input change(user.email.length > 0)
        if (!validateEmail(user.email)) {
            setInvalidEmail(true);
            setAllowClick(false);
            return;
        };
        
        // email entered was valid
        setInvalidEmail(false);
        
        // make a get request to server to check if the email entered is already registered
        Request.makeGetRequest("/users").then(res => {
            // decrypting the data returned as it contains the emails of existing users
            const bytes  = CryptoJS.AES.decrypt(res.data.users, process.env.REACT_APP_AES_SECRET_KEY);
            const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));        

            const existingUsers = decryptedData;
            const existingUser = checkIfItemInList(existingUsers, user.email, "email");
            
            // there is no existing user that matched the email entered
            if (!existingUser){
                // there were no validation errors(the entered email was not already registered nor invalid) and the user entered a password
                if ((!validationError) && (user.password.length > 0)) return setAllowClick(true);   
                    
                // the user did not enter a password
                return setAllowClick(false);
            }

            // the entered email is already registered
            setAllowClick(false);
            setValidationError(true);
            setValidationErrMessage("Email is already registered");

        }).catch(err => { console.log(err.message) });

    }, [user.email, user.password, validationError]);


    return <div className="details-box-container">
        <Logo />
        
        <div className="tweeter-intro">
            <h3>Join hundreds of millions of people on Tweeter to discover what's happening in the world.</h3>
        </div>

        <AuthenticationForm 
            email={user.email} invalidEmail={invalidEmail}
            password={user.password}
            buttonText="Join Now!" allowClick={allowClick}
            handleChange={handleChange} handleClick={handleClick} 
            validationError={validationError} validationErrMessage={validationErrMessage}
            dataLoading={loading}
        />

        <p className="social-profiles-text">or continue with these social profiles</p>

        <div className="social-profiles-container">
            <SocialLogin icon={<GoogleIcon className="socials-icon"/>} ariaLabel="Continue to tweeter using Google" location="auth/google" />
            <SocialLogin icon={<FacebookIcon className="socials-icon"/>} ariaLabel="Continue to tweeter using Facebook" location="auth/facebook" />
            <SocialLogin icon={<GitHubIcon className="socials-icon"/>} ariaLabel="Continue to tweeter using Github" location="auth/github" />
        </div>

        <RerouteFooter suggestAlternativeRouteText="Already a member?" alternativeRouteLoc="/login" 
        ariaLabel="Login to tweeter" alternativeRouteName="Login" />

    </div>
}

export default SignUp;