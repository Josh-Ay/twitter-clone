import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TrendsSuggestionsSkeletonContainer from "../components/TrendsSuggestionsSkeletonContainer";
import { Formatter } from "../helpers/Formatter";
import { Request } from "../requests/Request";

const TweetTrends = ({ userId }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [trends, setTrends] = useState([{
        name: "",
        tweetCount: 0
    }]);
    
    // handle route to a trend
    const handleRouteToTrend = (trendToRouteTo) => navigate(`${trendToRouteTo ? `/explore/trends/${trendToRouteTo}` : `/explore` }`, {state: {trendTag: trendToRouteTo ? trendToRouteTo : "@+)"}});

    // useEffect hook to get trends for the user
    useEffect(() => {
        Request.makeGetRequest(`/users/${userId}/u/tweet/t/trends`)
        .then(res => {
            setLoading(false);
            setTrends(res.data.trends);
        }).catch(err => {
            setLoading(false);
            console.log("An error occurred while trying to fetch the requested resource");
        })
    }, [userId])

    return <>
        {
            loading ? <TrendsSuggestionsSkeletonContainer /> : <div className="mini-container trends-container">
                <h5 className="title-text">Trends for you</h5>
                <hr className="custom-hr" />
                {React.Children.toArray(trends.map(trend => {
                    return <>
                    <div className="trending-tags-container" onClick={() => handleRouteToTrend(trend.name)}>
                        <span className="trending-tag-item">#{trend.name}</span>
                        <span className="trending-tag-item-count">{Formatter.formatNumber(trend.tweetCount)} Tweets</span>
                    </div>
                    </>
                }))}
            </div>
        }
    </>
}

export default TweetTrends;