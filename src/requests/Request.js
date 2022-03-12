import axios from "axios";
import qs from "qs";

require("dotenv").config();

// configuring the base url for all routes
axios.defaults.baseURL = process.env.REACT_APP_API_URL;

class Request{

    static makePostRequest = async (routeToPostTo, dataToPost) => {
        return await axios.post(routeToPostTo, qs.stringify(dataToPost));
    }
    
    static makeGetRequest = async (route) => {
        return await axios.get(route);
    }

    static makeGetRequestWithCredentials = async (route) => {
        const request = await axios.get(route, {
            withCredentials: true
        });
        return request;
    }
    
    static makePatchRequest = async (route, dataToPut) => {
        return await axios.patch(route, qs.stringify(dataToPut));
    }
    
    static uploadImage = async (routeToPostTo, imageFileToUpload) => {
        const request = await axios.patch(routeToPostTo, imageFileToUpload, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return request;
    }
    
    static makeMultipartPostRequest = async (routeToPostTo, dataToPost) => {
        const request = await axios.post(routeToPostTo, dataToPost, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return request;
    }

}

export { Request };
