const UserController = require("../controller/UserController");
const User = require("../model/User");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;


async function existUser(username) {
  let exists = false
  await User.findOne({username: username}, (err, user) => {
    if (err) throw new Error('Error searching user')
    if (user) exists = true 
  });
  return exists
};

exports.login = (req, res, next) => {
  if (req.body && req.body.username && req.body.password) {
    const username = req.body.username
    const plaintextPassword = req.body.password
    User.findOne({ username: username }, (err, user) => {
      if (err) {
        return res.status(500).send(err)
      }
      if(user) {
        const validPassword = bcrypt.compareSync(plaintextPassword, user.password)
        if (validPassword) {
          console.log("Login Authentication OK")
          // user params for use in authorization middleware
          const id = user._id
          const role = user.role
          const expiresIn = 10 * 60 * 1000 // milisseconds
          console.log("role login: " + role)
          var token = jwt.sign({id, role}, process.env.SECRET, {
            expiresIn: expiresIn
          });
          return res.status(201).send({
            auth: true,
            role: role,
            expiresIn: expiresIn,
            token: token});
        }
      }
      console.log("Login Authentication FAIL")
      res.status(401).send({ msg: "User or password invalid!"})
        
    })
  }
};

exports.signin = async (req, res, next) => {
  if (await existUser(req.body.username)) {
    const errorMsg = 'Username already in use.'
    console.log('Username already in use.')
    res.status(403).send({ msg: errorMsg })
  } 
  else {
    const plaintextPassword = req.body.password;
    // auto-gen a salt and hash
    bcrypt.hash(plaintextPassword, saltRounds, function(err, hash) {
        if (err) {
          res.status(500).send({ msg: err });
          return console.error(err);
        }
        // Store hash in password DB
        // console.log(req.body)
        req.body.password = hash
        // console.log(req.body)
        UserController.add(req, res)        
    });
  }
};

exports.logout = (req, res) => {
  console.log("Logout - not implemented");
  // make token expire
  res.status(200).send("Logout - not imnplemented")
};