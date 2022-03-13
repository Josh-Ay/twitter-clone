// test server connection
exports.test_server = (req, res) => {
    res.status(200).json({status: "Working"});
}