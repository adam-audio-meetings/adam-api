const { decode } = require("jsonwebtoken");
const jwt = require('jsonwebtoken');

exports.verifyJWT = (req, res, next) => {
  const token = req.get('x-access-token');
  if(!token) return res.status(401).json({
    auth: false, 
    message: 'No token provided.'});

  jwt.verify(token, process.env.SECRET, function (err, decoded) {
    if(err) return res.status(500).json({
        auth: false,
        message: 'Failed to authenticate.'
      });
    // if ok, save on request for future use
    req.userId = decoded.id;
    req.userRole = decoded.role;
    // console.log("jwt res.userRole: "+ req.userRole)
    next();
  });
};

exports.authRole = (roles) => {
  return (req, res, next) => {
    authorized = false
    // console.log(roles)
    roles.forEach(role => {
      // console.log(role + ": " + authorized)
      if (req.userRole === role) {
        authorized = true
        // console.log("authorization granted to: " + role)
      }
    });
    // console.log("final authoriaziton: "+authorized)
    if (authorized) {
      next();
    }
    // Forbidden: client is known but cannot access this content
    else res.sendStatus(403)
  }
};