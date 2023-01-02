// requiring the necessary packages
const cors = require("cors");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const morgan = require("morgan");

// to use 'url-extended'
exports.use_urlextended = express.urlencoded({extended: true})

// to use 'cors'
exports.use_cors = cors({
    origin: process.env.CLIENT_URL,
    credentials: true
});

// to create a session
exports.create_session = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_DB_URI }),
})

// to log requests
exports.use_morgan = morgan("dev");