const Audio = require("../model/Audio");


// list all
exports.list = (req, res) => {
  Audio.find().sort('-created_at').
    populate('teams', ['name', 'description']).
    exec((err, audios) => {
      if (err) {
        res.status(500).send({ msg: err });
        return console.error(err);
      }
      res.json(audios);
    });
};

// get by _id
exports.get_by_id = (req, res) => {
  Audio.findOne({ _id: req.params.id }, (err, audio) => {
    if (audio) {
      res.json(audio);
    } else {
      res.status(404).send({ msg: "Audio not found" });
    }
  });
};

// add
// exports.add = (req, res, err) => {
//   console.log('UPLOAD REQ:', req.files)
//   res.send({ msg: 'teste audio controller res'});
// };
// add sem gridfs
exports.add = (req, res) => {
  const newAudio = new Audio(req.body);
  newAudio.save((err, audio) => {
    if (err) return console.error(err);
    console.log(audio);
    res.status(201).json(audio);
  });
};

// alter
// exports.alter = (req, res) => {
//   let id = req.params.id;
//   let audioAlter = req.body;
//   // "member" and "coordinator" roles can only alter their own audios
//   if (process.env.ENABLE_AUTH === 'true' && req.audioRole != "admin" && req.audioId != id) {
//     // Forbidden: client is known but cannot access this content
//     res.sendStatus(403)
//   } else {
//     Audio.findOneAndUpdate(
//       { _id: id },
//       audioAlter,
//       { new: true },
//       (err, audioActual) => {
//         if (err) {
//           res.sendStatus(400);
//           console.error(err);
//         } else if (audioActual === null) {
//           res.sendStatus(404);
//         } else
//           res.json(audioActual);
//       }
//     );
//   }
// };

exports.remove = (req, res) => {
  const id = req.params.id;
  Audio.findOneAndDelete({ _id: id }, (err, audio) => {
    // TODO: handle err
    if (err) {
      res.sendStatus(400);
      console.error(err);
    } else if (audio === null) {
      res.sendStatus(404);
    } else {
      res.json(audio);
    }
  });
};

// search (filter)
exports.search = (req, res) => {
  if (req.query) {
    let teamId = req.query.teamId;
    let dateStringStart = req.query.dateStringStart;
    let dateStringEnd = req.query.dateStringEnd;
    let onlyInfo = req.query.onlyInfo;

    let selectionFields = (onlyInfo == 'true' ? '-fileId' : '');

    let searchDateStart = new Date(dateStringStart);
    let searchDateEnd = new Date(dateStringEnd);

    Audio.find(
      {
        $and: [
          { team: teamId },
          { created_at: { $gte: searchDateStart, $lt: searchDateEnd } }
        ]
      })
      .populate('member', ['name', 'username'])
      // exclui envio de blob para somente consulta de estatisticas
      .select(selectionFields)
      .exec((err, audios) => {
        if (err) {
          res.status(500).send({ msg: err });
          return console.error(err);
        }
        if (audios) {
          res.json(audios);
        } else {
          res.status(404).send({ msg: "Audios not found." });
        }
      });
  }
};
