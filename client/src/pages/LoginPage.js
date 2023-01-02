import Logo from '../components/Logo';
import SocialLogin from '../components/SocialLogin';
import AuthenticationForm from '../components/AuthenticationForm';
import RerouteFooter from '../components/RerouteFooter';
import { validateEmail } from '../validators/Validators';
import { Request } from '../requests/Request';
import useTitle from "../hooks/useTitle";
import GoogleIcon from '@material-ui/icons/Google';
import FacebookIcon from '@material-ui/icons/Facebook';
import GitHubIcon from '@material-ui/icons/GitHub';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';


const Login = ( { setCurrentUser, socketInstance } ) => {
    useTitle("Tweeter | Log In");

    const [user, setUser] = useState({ email: "", password: "", socketId: "" });
    const [invalidEmail, setInvalidEmail] = useState(false);
    const [allowClick, setAllowClick] = useState(false);
    const [validationError, setValidationError] = useState(false);
    const [validationErrMessage, setValidationErrMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // handle change in input
    const handleChange = (e) => {
        const {name, value} = e.target;
        setUser(prevValue => { 
            return {
                ...prevValue, 
                [name]: value,
                "socketId": socketInstance.id 
            } 
        });

        if (name === "email"){ setValidationError(false); };
    }

    // useEffect hook to monitor changes in the email entered
    useEffect(()=>{
        if (user.email.length < 1) return setInvalidEmail(false);
        
        // check if the email entered by the user is valid
        if (!validateEmail(user.email)){ 
            setInvalidEmail(true); 
            setAllowClick(false);
            return;
        }; 
        
        setInvalidEmail(false);
        
        if (user.password.length < 1) return setAllowClick(false);

        setAllowClick(true);

    }, [user.email, user.password]);


    // handle login click
    const handleClick = (e) =>{
        e.preventDefault();

        // if clicking is not allowed(because of invalid email or no password entered)
        if (!allowClick) return;

        // show loading animation on login button
        setLoading(true);

        // only post if there were no validation errors        
        Request.makePostRequest("/login", user).then(res=>{
            setLoading(false);
            setCurrentUser(res.data.user);
            localStorage.setItem("userData", JSON.stringify(res.data.user));
            navigate("/");
        }).catch(err => {
            setLoading(false);
            setValidationError(true);
            setValidationErrMessage(err.response ? err.response.data.error : err.message);
            setAllowClick(true);
        });

    }

    
    return <div className="details-box-container">
        <Logo />

        <div className="tweeter-intro">
            <h3>Login</h3>
            <p>Get connected back with what's happening in the world right now.</p>
        </div>

        <AuthenticationForm 
            email={user.email} invalidEmail={invalidEmail}
            password={user.password}
            buttonText="Login" allowClick={allowClick}
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

        <RerouteFooter suggestAlternativeRouteText="Don't have an account yet?" alternativeRouteLoc="/signup" 
        ariaLabel="Sign up to tweeter" alternativeRouteName="Register" />

    </div>
}

export default Login;
