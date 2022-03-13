// requiring multer
const multer = require("multer");

// configuring the destination for where the uploaded files will be stored
const upload = multer({dest: "./uploads/images"});

module.exports = upload;
