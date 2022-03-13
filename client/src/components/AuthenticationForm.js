import EmailIcon from '@material-ui/icons/Email';
import LockIcon from '@material-ui/icons/Lock';

const AuthenticationForm = (props) => {

    return <form className="user-form" autoComplete="off">
        {props.validationError ? <span className="form-error-message">{props.validationErrMessage}</span> : ""}
        {props.invalidEmail ? <span className="form-error-message">Please enter a valid email</span> : ""}
        <div className="details-input-box">
            <EmailIcon className="form-icon" />
            <input type="email" name="email" placeholder="Email" value={props.email} onChange={props.handleChange}></input>    
        </div>
        
        <div className="details-input-box">
            <LockIcon className="form-icon" />
            <input type="password" name="password" placeholder="Password" value={props.password} onChange={props.handleChange}></input>    
        </div>
        
        <div className="details-input-box" aria-disabled={props.allowClick ? "false" : "true"}>
            <button type="submit" onClick={props.handleClick} className={`submit-btn ${props.allowClick ? 'enabled': 'disabled'}`}>
                {props.dataLoading ? <span id="loading"></span> : props.buttonText}             
            </button>
        </div>
        
    </form> 
}

export default AuthenticationForm;