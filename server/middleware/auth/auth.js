// requiring the necessary packages
const passport = require("passport");
const localStrategy = require("./Strategies/LocalStrategy");
const googleStrategy = require("./Strategies/GoogleStrategy");
const githubStrategy = require("./Strategies/GithubStrategy");
const facebookStrategy = require("./Strategies/FacebookStrategy");
const User = require("../../models/user");

// configuring passport to use the above strategies
passport.use(localStrategy);
passport.use(googleStrategy);
passport.use(githubStrategy);
passport.use(facebookStrategy);

// serialize user
passport.serializeUser( (user, done) => {
    done(null, user._id);
});

// deserialize user
passport.deserializeUser( (id, done) => {
    User.findById(id, (err, user)=>{
        done(err, user);
    });
});

module.exports = passport;
