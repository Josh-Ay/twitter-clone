import { useRef, useState } from "react";
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera';
import Done from '@material-ui/icons/Done';
import { useNavigate } from "react-router";
import { checkImageFile } from "../validators/Validators";
import { Request } from "../requests/Request";
import { Formatter } from "../helpers/Formatter";

const UserProfileForm = (props) => {
    const fileUploadRef = useRef(null);
    const coverFileUploadRef = useRef(null);
    const profileImageRef = useRef(null);
    const userCoverPhotoRef = useRef(null);
    const navigate = useNavigate();
    const [imageOver, setImageOver] = useState(false);
    const [imageUploadErrMsg, setImageUploadErrMsg] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);
    const [coverLoading, setCoverLoading] = useState(false);
    const [isProfileUploadSuccessful, setProfileUploadSuccessful] = useState(false);
    const [isCoverUploadSuccessful, setCoverUploadSuccessful] = useState(false);

    // open file upload dialog box
    const openFileUpload = (type) => { 
        if (type) return coverFileUploadRef.current.click();

        fileUploadRef.current.click(); 
    }

    const handleCancelClick = (e) => {
        e.preventDefault();
        navigate(-1);   // go back to the previous page
    };

    // prevent the browser's default behaviour of opening up the file on drop
    window.addEventListener("drop", (e) => { e.preventDefault() });
    window.addEventListener("dragover", (e) => { e.preventDefault() });

    const handleDragEnter = () => { setImageOver(true); }

    const handleDragLeave = () => { setImageOver(false); }

    const handleImageDrop = (e, type) => {
        setImageOver(false);

        // accept drag and drop of only files
        if (e.dataTransfer.items && e.dataTransfer.items[0].kind === "file"){

            // handle if more than one file was dropped
            if (e.dataTransfer.items.length > 1) { return setImageUploadErrMsg("Please select only one file.") }
            
            // check if the filetype is one of the accepted filetypes('.jpg', '.jpeg', '.png')
            const acceptedFile = checkImageFile(e.dataTransfer.items[0].type);

            // return an error message if the filetype is not one of the accepted filetypes
            if (!acceptedFile){ return setImageUploadErrMsg("Please select an image.")}

            // remove the error message(for image upload) if any
            setImageUploadErrMsg("");

            // upload the image and show loading animation
            if (type) {
                sendImage(e.dataTransfer.items[0].getAsFile(), type); 
                setCoverLoading(true);
                return;
            }
            
            sendImage(e.dataTransfer.items[0].getAsFile());
            setProfileLoading(true);
        }
    }

    const handleImageLoad = (e, type) => {
        if (e.target.files && e.target.files[0]) {

            // check if the filetype is one of the accepted filetypes('.jpg', '.jpeg', '.png')
            const acceptedFile = checkImageFile(e.target.files[0].type);
            
            // return an error message if the filetype is not one of the accepted filetypes
            if (!acceptedFile){ return setImageUploadErrMsg("Please select an image.") }
            
            // remove the error message(for image upload) if any
            setImageUploadErrMsg("");

            // upload the image and show loading animation
            if (type) {
                sendImage(e.target.files[0], type); 
                setCoverLoading(true);
                return;
            };

            sendImage(e.target.files[0]);
            setProfileLoading(true);
        };
    }

    const sendImage = (image, typeOfImage) => {
        // creating a new form and appending an object with key "image" that holds the image file
        const file = new FormData();
        file.append("image", image);
        file.append("username", props.usernamePlaceholder);
        if (typeOfImage) file.append("coverPhoto", true);

        // creating a new blob url with the image file and using it as the background image for the 'profile photo' to display to the user
        let imageBlobUrl = URL.createObjectURL(image);
        
        if (typeOfImage){
            userCoverPhotoRef.current.style.backgroundImage = `url(${imageBlobUrl})`;
        }else{
            profileImageRef.current.style.backgroundImage = `url(${imageBlobUrl})`;
        }
        
        // uploading the image
        Request.uploadImage(`/users/${props.user_id}/photo/upload`, file).then(res => {
            // remove loading animation
            if (typeOfImage){
                setCoverLoading(false);
            }else{
                setProfileLoading(false);
            }

            // delete the blob url created above to save memory
            URL.revokeObjectURL(imageBlobUrl);
            
            // updating the user data stored in local storage
            localStorage.setItem("userData", JSON.stringify(res.data.user));
            
            // updating the current user state data
            props.updateCurrentUser(res.data.user);

            // show success icon on the profile photo or cover photo
            if (typeOfImage) return setCoverUploadSuccessful(true);

            setProfileUploadSuccessful(true);

            
        }).catch(err => {
            // remove loading animation
            if (typeOfImage){
                setCoverLoading(false);

                // reset the 'cover photo' background to the previous one if any
                userCoverPhotoRef.current.style.backgroundImage = `url(${props.coverPhoto ? Formatter.formatImageStr(props.profilePhoto) : "assets/blank-profile-picture.svg" })`;
            }else{
                setProfileLoading(false);

                // reset the 'profile photo' background to the previous one if any
                profileImageRef.current.style.backgroundImage = `url(${props.profilePhoto ? Formatter.formatImageStr(props.profilePhoto) : "assets/blank-profile-picture.svg" })`;
            }

            // show an error message
            setImageUploadErrMsg("An error occured while uploading your image. Please try again.");

             
            // delete the blob url created above to save memory
            URL.revokeObjectURL(imageBlobUrl);
        });
        
    }

    return <div className="user-profile-edit-container">
        <h2>{props.title}</h2>
        {props.errorMsg && <div className="error-message-container"><span>{props.errorMsg}</span></div>}
        {imageUploadErrMsg && <div className="error-message-container"><span>{imageUploadErrMsg}</span></div>}

        <form autoComplete="off">
            <div className={`profile-image-upload-container ${isProfileUploadSuccessful && "success"}`} >
                <div className="profile-image" onDragLeave={handleDragLeave} onDragEnter={handleDragEnter} style={{backgroundImage: props.profilePhoto ? `url(${Formatter.formatImageStr(props.profilePhoto)})` : "url(assets/blank-profile-picture.svg)", backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" }} aria-label="user display pic" ref={profileImageRef}>
                    <div className="image-mask" onDrop={handleImageDrop} style={{border: imageOver ? "1px solid #2D9CDB": "", opacity: imageOver ? "0.5": "1"}}  onClick={profileLoading ? () => {} : openFileUpload} >{profileLoading ? <div id="loading"></div> : isProfileUploadSuccessful ? <Done style={{color: "#2f80ed"}} /> : <PhotoCameraIcon onDragOver={handleDragEnter} style={{color: "white"}} />}</div>
                </div>
                <label htmlFor="profile-image-upload" className={`profile-image-upload-btn ${isProfileUploadSuccessful && "success"}`}>{isProfileUploadSuccessful ? "Successfully changed profile photo!" : "Change photo"}</label>
                <input type="file" id="profile-image-upload" ref={fileUploadRef} onChange={handleImageLoad} />
            </div>
            
            <div className={`profile-image-upload-container cover-image-container ${isCoverUploadSuccessful && "success"}`} >
                <div className="profile-image" onDragLeave={handleDragLeave} onDragEnter={handleDragEnter} style={{backgroundImage: props.coverPhoto ? `url(${Formatter.formatImageStr(props.coverPhoto)})` : "url(assets/blank-profile-picture.svg)", backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" }} aria-label="user cover pic" ref={userCoverPhotoRef}>
                    <div className="image-mask" onDrop={(e) => {handleImageDrop(e, "cover")} } style={{border: imageOver ? "1px solid #2D9CDB": "", opacity: imageOver ? "0.5": "1"}}  onClick={coverLoading ? () => {} : () => {openFileUpload("cover") }} >{coverLoading ? <div id="loading"></div> : isCoverUploadSuccessful ? <Done style={{color: "#2f80ed"}} /> : <PhotoCameraIcon onDragOver={handleDragEnter} style={{color: "white"}} />}</div>
                </div>
                <label htmlFor="cover-image-upload" className={`profile-image-upload-btn ${isCoverUploadSuccessful && "success"}`}>{isCoverUploadSuccessful ? "Successfully changed cover photo!" : "Change cover photo"}</label>
                <input type="file" id="cover-image-upload" ref={coverFileUploadRef} onChange={(e) => {handleImageLoad(e, "cover")} } />
            </div>

            <label htmlFor="displayName">Full Name</label>
            <input type="text" placeholder={props.displayNamePlaceholder} name="displayName" id="displayName" value={props.displayName} onChange={props.handleInputChange}></input>

            <label htmlFor="username">Username</label>
            <input type="text" className={`${props.errorMsg ? "form-error" : ""}`} placeholder={props.usernamePlaceholder} name="username" id="username" value={props.username} onChange={props.handleInputChange}></input>
            
            <label htmlFor="userBio">Bio</label>
            <textarea placeholder={props.bioPlaceholder} name="userBio" id="userBio" value={props.userBio} onChange={props.handleInputChange}></textarea>
        
            <input type="submit" value="Save" onClick={props.handleSubmitClick} className={`save-btn submit-btn ${props.allowClick ? 'enabled': 'disabled'}`}></input>
            {props.showCancelBtn && <input type="submit" value="Cancel" onClick={handleCancelClick} className="cancel-btn"></input>}
        </form>
    </div>
}

export default UserProfileForm;
