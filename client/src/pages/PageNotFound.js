import useTitle from "../hooks/useTitle";
import NavigationBar from "../components/NavigationBar";
import { useNavigate } from "react-router-dom";

const PageNotFound = ( {user, navigationBarReference} ) => {
    const navigate = useNavigate();
    
    useTitle("404 | Page Not Found");

    const handleClick = () => navigate("/"); 
    
    return <>
        <NavigationBar user={user ? user: ""} navigationBarReference={navigationBarReference} />
        <main>
            <div className="main-container page-not-found-container">
                <figure>
                    <img src="/assets/404-page-not-found.svg" alt="404 resource not found illustration"/>
                </figure>
                <h1>404 not found</h1>
                <p>Requested resource does not exist or has been removed</p>
                <button className="go-home-btn" onClick={handleClick}>Go Home</button>
            </div>
        </main>
    </>
}

export default PageNotFound;