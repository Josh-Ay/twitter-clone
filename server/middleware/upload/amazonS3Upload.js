require("dotenv").config();

// requiring the aws client sdk and the filestream module
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");

// configuring an object of the client aws-sdk to use the credientials for an existing s3 bucket
const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    region: process.env.AWS_BUCKET_REGION,
    secretAccessKey: process.env.AWS_SECRET_KEY
});

// upload a file to s3 bucket and return promise
exports.uploadToAws = (fileToUpload) => {
    // constructing the parameters for the file to be uploaded to the aws bucket
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileToUpload.filename,
        Body: fs.createReadStream(fileToUpload.path)
    };

    return s3.upload(params).promise();
};

// function to get a object from s3 bucket passing in the key as parameter and returning a promise
exports.getFileFromAws = (fileKeyToGet) => {
    // constructing the parameters for the file to be gotten from the aws bucket
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKeyToGet
    };

    return s3.getObject(params).promise();
};

// function to delete an object from s3 bucket
exports.deleteFileInAwsBucket = (fileKeyToDelete) => {
    // constructing the parameters for the file to be deleted from the aws bucket
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKeyToDelete
    };

    return s3.deleteObject(params).promise();
}
