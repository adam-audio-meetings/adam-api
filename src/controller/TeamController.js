const Team = require("../model/Team");
const User = require("../model/User");

// list all teams
exports.list = (req, res) => {
  const userRole = req.userRole;
  if (userRole == 'admin') {
    Team.find().
      populate('members', ['name', 'username']).
      populate('coordinator', ['name', 'username']).
      exec((err, teams) => {
        if (err) {
          res.status(500).send({ msg: err });
          return console.error(err);
        }
        res.json(teams);
      });

    // no admin or noauth user
  } else {
    Team.find().
      select(['name', 'category', 'description', 'coordinator']).
      populate('coordinator', ['name']).
      exec((err, teams) => {
        if (err) {
          res.status(500).send({ msg: err });
          return console.error(err);
        }
        res.json(teams);
      });
  }
};

// list all teams of the user (different responses by role member or coordinator)
exports.listOwn = (req, res) => {
  const userRole = req.userRole;
  const userId = req.userId;
  if (userRole == 'coordinator') {
    Team.find({ coordinator: userId }).
      populate('members', ['name', 'username']).
      populate('coordinator', ['name', 'username']).
      exec((err, teams) => {
        if (err) {
          res.status(500).send({ msg: err });
          return console.error(err);
        }
        res.json(teams);
      });
  } else if (userRole == 'member') {
    User.findOne({ _id: userId }).
      exec((err, user) => {
        if (err) {
          res.status(500).send({ msg: err });
          return console.error(err);
        }
        const teamsId = user.teams;
        Team.find({ _id: teamsId }).
          populate('coordinator', 'name').
          select(['name', 'description', 'category']).
          exec((err, teams) => {
            if (err) {
              res.status(500).send({ msg: err });
              return console.error(err);
            }
            res.json(teams);
          });
      });
  }
};

// list all teams not of the user (different responses by role member or coordinator)
// TODO: join listOwn and listAvailable
exports.listAvailable = (req, res) => {
  const userRole = req.userRole;
  const userId = req.userId;
  if (userRole == 'coordinator') {
    Team.find({ coordinator: { $not: { $eq: userId } } }).
      populate('members', ['name', 'username']).
      populate('coordinator', ['name', 'username']).
      exec((err, teams) => {
        if (err) {
          res.status(500).send({ msg: err });
          return console.error(err);
        }
        res.json(teams);
      });
  } else if (userRole == 'member') {
    User.findOne({ _id: userId }).
      exec((err, user) => {
        if (err) {
          res.status(500).send({ msg: err });
          return console.error(err);
        }
        const teamsId = user.teams;
        Team.find({ _id: { $nin: teamsId } }).
          populate('coordinator', 'name').
          select(['name', 'description', 'category']).
          exec((err, teams) => {
            if (err) {
              res.status(500).send({ msg: err });
              return console.error(err);
            }
            res.json(teams);
          });
      });
  }
};

// get by _id
exports.get_by_id = (req, res) => {
  Team.findOne({ _id: req.params.id }).
    populate('members', ['name', 'username']).
    populate('coordinator', ['name', 'username']).
    exec((err, team) => {
      if (team) {
        res.json(team);
      } else {
        res.sendStatus(404);
      }
    });
};

// add
exports.add = (req, res) => {
  const coordinatorId = req.userId;
  req.body.coordinator = coordinatorId;
  const newTeam = new Team(req.body);
  newTeam.save((err, team) => {
    if (err) {
      res.status(500).send({ msg: err })
    } else {
      res.status(201).json(team)
    }
  })
};

//alter
exports.alter = (req, res) => {
  let id = req.params.id;
  let teamAlter = req.body;
  Team.findOneAndUpdate(
    { _id: id },
    teamAlter,
    { new: true },
    (err, teamActual) => {
      if (err) {
        res.sendStatus(400);
        console.error(err);
      } else if (teamActual === null) {
        res.sendStatus(404);
      } else
        res.json(teamActual);
    }
  );
};

exports.remove = (req, res) => {
  const id = req.params.id;
  Team.findOneAndDelete({ _id: id }, (err, team) => {
    // TODO: handle err
    if (err) {
      res.sendStatus(400);
      console.error(err);
    } else if (team === null) {
      res.sendStatus(404);
    } else {
      res.json(team);
    }
  });
};

// todo: utilizar dados db e pesquisar pelo db
exports.subscribe = async function (req, res) {
  // todo: error handling if values do not exist
  const memberId = req.userId
  const teamId = req.body.teamId

  try {
    const existsTeam = await existsTeamId(teamId);
    if (existsTeam) {
      // (fazer em etapa anterior, no crud equipes)
      // pesquisar equipes (somente equipes em que member não participa)

      let subscribed = await isMemberSubscribed(teamId, memberId)

      if (subscribed) {
        return res.status(500).send({ msg: 'Member already subscribed on this team.' })
      }
      // tratar possivel erro em uma das operacoes ou ambas
      const updateMemberId = { $push: { members: memberId } };
      Team.findByIdAndUpdate(
        teamId,
        updateMemberId,
        { new: true },
        (err, teamActual) => {
          if (err) {
            return res.status(500).send({ msg: err })
          } else {
            res.json(teamActual)
          }
        });
      const updateTeamId = { $push: { teams: teamId } };
      User.findByIdAndUpdate(
        memberId,
        updateTeamId,
        { new: true },
        (err, userActual) => {
          if (err) {
            // deve desfazer a operação anterior (usar transaction?)
            return res.status(500).send({ msg: err })
            // } else {
            //  res.json(userActual)
          }
        });
    } else {
      res.status(404).send({ msg: "Team does not exist." })
    }
  } catch (error) {
    res.status(404).send({ msg: "Incorrect team id." })
  }
};

// todo: utilizar dados db e pesquisar pelo db
exports.unsubscribe = async function (req, res) {
  // todo: error handling if values do not exist
  const memberId = req.userId
  const teamId = req.body.teamId

  try {
    const existsTeam = await existsTeamId(teamId);
    if (existsTeam) {
      // (fazer em etapa anterior, no crud equipes)
      // pesquisar equipes (somente equipes em que member não está matriculado)

      let subscribed = await isMemberSubscribed(teamId, memberId)

      if (!subscribed) {
        return res.status(500).send({ msg: 'Member not subscribed on this team.' })
      }
      // tratar possivel erro em uma das operacoes ou ambas
      const updateMemberId = { $pull: { members: memberId } };
      Team.findByIdAndUpdate(
        teamId,
        updateMemberId,
        { new: true },
        (err, teamActual) => {
          if (err) {
            return res.status(500).send({ msg: err })
          } else {
            res.json(teamActual)
          }
        });
      const updateTeamId = { $pull: { teams: teamId } };
      User.findByIdAndUpdate(
        memberId,
        updateTeamId,
        { new: true },
        (err, userActual) => {
          if (err) {
            // deve desfazer a operação anterior (usar transaction?)
            return res.status(500).send({ msg: err })
            // } else {
            //   res.json(userActual)
          }
        });
    } else {
      res.status(404).send({ msg: "Team does not exist." })
    }
  } catch (error) {
    res.status(404).send({ msg: "Incorrect team id." })
  }
};

async function isMemberSubscribed(teamId, memberId) {
  const team = await Team.findById(teamId, (err, team) => {
    if (err) {
      throw new Exception(err)
    } else {
      return team
    }
  });
  // console.log(team)
  let subscribed = new Promise(

    function (resolve, reject) {
      let value = false
      let i = 0
      let membersIdArray = team.members
      while (!value && i < membersIdArray.length) {
        if (membersIdArray[i] == memberId) {
          value = true
          //resolve(value)
        }
        i++
      }
      resolve(value)
    }
  )
  return subscribed
};

// search (filter)
exports.search = (req, res) => {
  if (req.query) {
    const name = req.query.name
    const description = req.query.description

    Team.find({
      $or: [
        { name: { $regex: new RegExp(name, "ig") } },
        { description: { $regex: new RegExp(description, "ig") } }
      ]
    })
      .populate('members', ['name', 'username'])
      .populate('coordinator', ['name', 'username'])
      .exec((err, teams) => {
        if (err) {
          res.status(500).send({ msg: err });
          return console.error(err);
        }
        if (teams) {
          res.json(teams);
        } else {
          res.status(404).send({ msg: "Teams not found." });
        }
      });
  }
};

async function existsTeamId(id) {
  let exists = false
  await Team.findOne({ _id: id }, (err, team) => {
    //if (err) throw new Error('Error searching team.')
    if (team) exists = true
  });
  return exists
};
