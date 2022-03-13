// logout current user
exports.logout_user = (req, res) => {
    req.logout();
    req.session.destroy((err) => {
        if (err) return res.status(500).json({error: "An error occurred while trying to logout"});
        
        res.status(200).json({message: "successfully logged out"});
    });
    
}
