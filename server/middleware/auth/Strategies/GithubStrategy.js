// requiring the 'User' model and the 'Github Stategy' from passport
const User = require("../../../models/user");
const GithubStrategy = require("passport-github2").Strategy;

module.exports = new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `/auth/github/success`
},
(accessToken, refreshToken, profile, done) => {
    User.findOrCreate({ 
        githubId: profile.id 
        }, {
            displayName: profile.username,
            profilePhoto: profile.photos ? profile.photos[0].value : "",
            email: profile.emails[0].value
        },
        (err, user) => {
            return done(err, user);
        }
    );
});