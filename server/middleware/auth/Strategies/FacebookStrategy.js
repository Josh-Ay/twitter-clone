// requiring the 'User' model and the 'Facebook Stategy' from passport
const User = require("../../../models/user");
const FacebookStrategy = require("passport-facebook").Strategy;

module.exports = new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.API_URL}/auth/facebook/success`,
    profileFields: ["id", "emails", "displayName", "picture.type(large)"]
},
(accessToken, refreshToken, profile, cb) => {
    User.findOrCreate({ 
        facebookId: profile.id 
    }, {
        displayName: profile.displayName,
        email: profile.emails[0].value,
        profilePhoto: profile.photos ? profile.photos[0].value : ""
    }, 
    (err, user) => {
        return cb(err, user);
    });
});
