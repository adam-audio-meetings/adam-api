const User = require("../model/User");

// list all
exports.list = (req, res) => {
  User.find().
    populate('teams', ['name', 'description']).
    exec((err, users) => {
      if (err) {
        res.status(500).send({ msg: err });
        return console.error(err);
      }
      res.json(users);
    });
};

// get by _id
exports.get_by_id = (req, res) => {
  User.findOne({ _id: req.params.id }, (err, user) => {
    if (user) {
      res.json(user);
    } else {
      res.status(404).send({ msg: "User not found" });
    }
  });
};

// add
// todo: admin privilege
exports.add = (req, res) => {
  const newUser = new User(req.body);
  newUser.save((err, user) => {
    if (err) return console.error(err);
    res.status(201).json(user);
  });
};

//alter
exports.alter = (req, res) => {
  let id = req.params.id;
  let userAlter = req.body;
  // "member" and "coordinator" roles can only alter their own users
  if (process.env.ENABLE_AUTH === 'true' && req.userRole != "admin" && req.userId != id) {
    // Forbidden: client is known but cannot access this content
    res.sendStatus(403)
  } else {
    User.findOneAndUpdate(
      { _id: id },
      userAlter,
      { new: true },
      (err, userActual) => {
        if (err) {
          res.sendStatus(400);
          console.error(err);
        } else if (userActual === null) {
          res.sendStatus(404);
        } else
          res.json(userActual);
      }
    );
  }
};

exports.remove = (req, res) => {
  const id = req.params.id;
  User.findOneAndDelete({ _id: id }, (err, user) => {
    // TODO: handle err
    if (err) {
      res.sendStatus(400);
      console.error(err);
    } else if (user === null) {
      res.sendStatus(404);
    } else {
      res.json(user);
    }
  });
};

// search (filter)
exports.search = (req, res) => {
  if (req.query) {
    const role = req.query.role
    const name = req.query.name
    const username = req.query.username
    const email = req.query.email

    User.find(
      {
        $or: [
          { role: { $regex: new RegExp(role, "ig") } },
          { name: { $regex: new RegExp(name, "ig") } },
          { username: { $regex: new RegExp(username, "ig") } },
          { email: { $regex: new RegExp(email, "ig") } }
        ]
      }, (err, users) => {
        if (err) {
          res.status(500).send({ msg: err });
          return console.error(err);
        }
        if (users) {
          res.json(users);
        } else {
          res.status(404).send({ msg: "Users not found." });
        }
      });
  }
};
