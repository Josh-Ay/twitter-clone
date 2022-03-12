import LoadingPage from "./pages/LoadingPage";
import SignUp from "./pages/SignUpPage";
import Login from "./pages/LoginPage";
import NewUser from "./pages/NewUserSetUpProfilePage";
import Home from "./pages/Home";
import ExplorePage from "./pages/ExplorePage";
import PageNotFound from "./pages/PageNotFound";
import UserProfilePage from "./pages/UserProfilePage";
import Bookmarks from "./pages/Bookmarks";
import MessagesPage from "./pages/MessagesPage";
import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Request } from "./requests/Request";

require("dotenv").config();

const socket = io(process.env.REACT_APP_API_URL);

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isPageLoading, setPageLoading] = useState(true);
  const [socialAuthError, setSocialAuthError] = useState(null);

  // 'useEffect' hook to auto-login oauth user
  useEffect(() => {
    
    Request.makeGetRequestWithCredentials("/auth/login/success")
    .then(res => {
      setCurrentUser(res.data.user);
      setPageLoading(false);
    })
    .catch(err => {  
      setSocialAuthError("Social authentication failed");
      console.log("Social authentication failed");
      setPageLoading(false);
    });

  }, []);


  // 'useEffect' hook to auto-login local user
  useEffect(() => {
    // getting the saved user data stored in the local storage
    const savedUserData = localStorage.getItem("userData");
    
    // if there was no user data stored, update the 'isPageLoading' variable
    if (!savedUserData) return setPageLoading(false);

    // if there was user data found in the local storage, parse the found data and set the 'currentUser' state variable to it
    setCurrentUser(JSON.parse(savedUserData));
    setPageLoading(false);

  }, []);



  // 'useEffect' hook to update the current user's 'socketId' on page refresh or new load of page
  useEffect(() => {
    if (isPageLoading) return;

    socket.on("connect", () => {

      // if there is no saved(logged-in) user
      if (!currentUser) return;

      socket.emit("user-update-socket-id", currentUser._id, socket.id, currentUser.username, (response) => {
        // if there was an error while trying to update the current user's socket id
        if (response.error) return console.log(response.error);

        // updating the 'currentUser' state and the value stored in the local storage too(if any)
        setCurrentUser(response.user);

        // if there was no social auth error(user's social account is connected), then there is no need to update/save in local storage
        if (!socialAuthError) return ;
        
        localStorage.setItem("userData", JSON.stringify(response.user));

      });

    })
  }, [currentUser, isPageLoading, socialAuthError]);

  if(isPageLoading){
    return (
      <LoadingPage />
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={currentUser ? <Home user={currentUser} updateCurrentUser={setCurrentUser} /> : <Login setCurrentUser={setCurrentUser} socketInstance={socket} />} 
      />

      <Route path="/login" element={<Login setCurrentUser={setCurrentUser} socketInstance={socket} />} />
      <Route path="/signup" element={<SignUp setCurrentUser={setCurrentUser} socketInstance={socket} />} />
      
      <Route 
        path="/configure-profile" 
        element={currentUser ? <NewUser user={currentUser} updateCurrentUser={setCurrentUser} notSocialUser={socialAuthError} /> : <Login setCurrentUser={setCurrentUser} socketInstance={socket} />} 
      />
      
      <Route path="explore" element={currentUser ? <ExplorePage user={currentUser}  />  : <Login setCurrentUser={setCurrentUser} socketInstance={socket} />}>
        <Route path="trends/:trend" element={currentUser ? <ExplorePage user={currentUser} />  : <Login setCurrentUser={setCurrentUser} socketInstance={socket} />} />
      </Route>
      
      <Route path="/bookmarks" element={currentUser ? <Bookmarks user={currentUser} /> : <Login setCurrentUser={setCurrentUser} socketInstance={socket} />} />
      <Route path="/:user" element={currentUser ? <UserProfilePage loggedInUser={currentUser} updateCurrentUser={setCurrentUser} notSocialUser={socialAuthError} /> : <Login setCurrentUser={setCurrentUser} socketInstance={socket} /> } />
      
      <Route path="/messages" element={currentUser ? <MessagesPage user={currentUser} socketInstance={socket} /> : <Login setCurrentUser={setCurrentUser} socketInstance={socket} />} />

      <Route path="*" element={<PageNotFound />} />
      
    </Routes>
  );
}

export default App;
