require('dotenv').config();

// requiring the 'User' model and the 'Google Stategy' from passport
const User = require("../../../models/user");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

module.exports = new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/success"
},
(accessToken, refreshToken, profile, cb) => {
    User.findOrCreate({
        googleId: profile.id 
        }, {
            displayName: profile.displayName,
            profilePhoto: profile.photos ? profile.photos[0].value : "",
            email: profile.emails[0].value
        },  
        (err, user) => {
            return cb(err, user);
        }
    );
});
