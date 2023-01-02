// requiring the neccessary package: mongoose, passportLocalMongoose, mongoose-findorcreate,tweetSchema and messageSchema
const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

// defining a new schema
const userSchema = new Schema({
    email: String,
    socketId: String,
    password: String,
    googleId: String,
    facebookId: String,
    githubId: String,
    displayName: String,
    username: String,
    about: String,
    profilePhoto: String,
    coverPhoto: String,
    followers: [],
    following: [],
    isVerified: {
        type: Boolean,
        default: false
    }
});

// configuring options for passport-local-mongoose
const options = {
    usernameField: "email", 
    saltLen : process.env.SALT_LENGTH,
    errorMessages: {
        UserExistsError: "Email already registered. Login?",
        IncorrectUsernameError: "Email not registered. Register?",
    }
};

// making the userSchema use passport-local-mongoose and mongoose-findorcreate(adding the packages as plug-ins to the 'userSchema')
userSchema.plugin(passportLocalMongoose, options);
userSchema.plugin(findOrCreate);

// exporting the user model
module.exports = new model("User", userSchema);
