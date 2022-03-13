import { Link } from "react-router-dom";

const RerouteFooter = (props) => {
    return <div className={props.className ? props.className : "user-reroute-container"}>
        {props.suggestAlternativeRouteText} <Link to={props.alternativeRouteLoc} aria-label={props.ariaLabel}>{props.alternativeRouteName}</Link>
    </div>
}

export default RerouteFooter;