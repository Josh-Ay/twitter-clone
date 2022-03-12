import Logo from "../components/Logo";

const LoadingPage = () => {
    
    return <div className="loading-page-container">
        <Logo disableClick={true} />
        <div className="bouncer">
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>
}

export default LoadingPage;
