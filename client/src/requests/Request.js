import axios from "axios";
import qs from "qs";

// configuring the base url for all routes
axios.defaults.baseURL = process.env.REACT_APP_API_URL;

class Request{

    // make post request to a route on the server passing the data you would like to post
    static makePostRequest = async (routeToPostTo, dataToPost) => {
        return await axios.post(routeToPostTo, qs.stringify(dataToPost));
    }
    
    // make a get request to a route on the server
    static makeGetRequest = async (route) => {
        return await axios.get(route);
    }

    // make a get request with credentials to a route on the server
    static makeGetRequestWithCredentials = async (route) => {
        const request = await axios.get(route, {
            withCredentials: true
        });
        return request;
    }
    
    // make a patch request to a route on the server
    static makePatchRequest = async (route, dataToPut) => {
        return await axios.patch(route, qs.stringify(dataToPut));
    }
    
    // upload a single image to a route on the server
    static uploadImage = async (routeToPostTo, imageFileToUpload) => {
        const request = await axios.patch(routeToPostTo, imageFileToUpload, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return request;
    }
    
    // make a multi-part post request(request with images if any) to a route on the server
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
