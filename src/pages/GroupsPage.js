import useTitle from "../hooks/useTitle";

const GroupsPage = () => {

    useTitle("Groups");

    return <>
        <div className="main-container groups-page-container">
            <h1 className="title-text">Groups</h1>
            <figure>
                <img className="coming-soon-icon" src="/assets/page-under-construction.svg" alt="page under construction illustration"></img>
            </figure>
        </div>
    </>
}

export default GroupsPage;
