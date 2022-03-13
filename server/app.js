require('dotenv').config();

// importing all the necessary packages
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const config = require("./middleware/config");
const passportSetup = require("./middleware/auth/auth");
const passport = require("passport");
const mongoose = require("mongoose");
const port = process.env.PORT || 5000;
const testRoute = require("./routes/testRoute");
const authRoutes = require("./routes/authRoutes");
const signUpRoute = require("./routes/signUpRoute");
const loginRoute = require("./routes/loginRoute");
const logoutRoute = require("./routes/logoutRoute");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const socketController = require("./controllers/socket/socketChatController");
const handler404Controller = require("./controllers/404Handler");

// creating an express app
const app = express();

// creating a new http server instance with the express app created above
const httpServer = createServer(app);

// creating a new instance of the socket-io 'Server' with the http server instance created above
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL,
    }
});

// when a client connects(the socket-io client library)
io.on("connection", (socket) => {
    console.log("connected with: ", socket.id);

    // update a user's socket id
    socket.on("user-update-socket-id", socketController.user_update_socket_id);
    
    // get a user's socket-id
    socket.on("get-user-socket-id", socketController.get_socket_id);
    
    // send a message to the another user with the 'userSocketId' passed below
    socket.on("send-message", (message, userSocketId) => {
        // sending the message to only that user
        socket.to(userSocketId).emit("receive-message", message);
    });
})

// configuring the middlewares for this express app(to use cors, passport, create a session..)
app.use(config.use_urlextended);
app.use(config.use_cors);
app.use(config.create_session);
app.use(passport.initialize());
app.use(passport.session());

// connecting to the mongodb database
// mongoose.connect("mongodb://localhost:27017/tweeterDB")     // local use
mongoose.connect(process.env.MONGO_DB_URI);     // mongo atlas


// test route
app.use("/", testRoute);

// register a new user
app.use("/", signUpRoute);

// login a new user using email and password
app.use("/", loginRoute);

// oauth authentication with passport
app.use("/auth", authRoutes);

// logout current user
app.use("/", logoutRoute);

// user routes
app.use("/", userRoutes);

// message routes
app.use("/", messageRoutes);

// 404 route handler
app.use(handler404Controller.handle_404_requests);

// listen for connections on the specified port
httpServer.listen(port, () => { console.log("Server running on port "+port) });
