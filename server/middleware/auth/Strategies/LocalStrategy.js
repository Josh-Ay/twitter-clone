// requiring the 'User' model
const User = require("../../../models/user");

// exporting a new Local Strategy created using the 'User' model
module.exports = User.createStrategy();
