const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const server = require('http').createServer(app);
const AudioController = require("./controller/AudioController")
const Audio = require("./model/Audio");

// configure CORS // teste para deploy em Heroku
var corsOptionsSocket = {
  // origin: process.env.FRONTEND_HEROKU_ENDPOINT || 'http://localhost:4200',
  cors: {
    // não pode ser true ou '*'?
    // usar options
    // origin: process.env.FRONTEND_HEROKU_ENDPOINT || 'http://localhost:4200',
    // origin: true,
    origin: process.env.FRONTEND_HEROKU_ENDPOINT || 'http://localhost:4200',
    methods: ["GET,HEAD,PUT,PATCH,POST,DELETE",]


  }


}

const io = require('socket.io')(server,
  corsOptionsSocket
  //https://socket.io/docs/v3/handling-cors/
  // cors: {
  //   // origin: `${protocol}://${host}:${port}`,
  //   origin: true, // FIXME
  //   // origin: 'http://localhost:4200', // FIXME: única instancia
  //   // origin: process.env.FRONTEND_HEROKU_ENDPOINT || 'http://localhost:4200',
  //   methods: ["GET", "POST"]
  // }
);
// const io = require('socket.io')();
// io.attach(server);

const mongoose = require("mongoose");
const morgan = require("morgan");

const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');

const crypto = require('crypto');
const Grid = require('gridfs-stream');
var formidable = require("formidable");
require('dotenv-safe').config();

// socket.io params
// let timerId = null;
// let sockets = new Set();


// disable auth on .env only for quick tests purpose
const enable_auth = process.env.ENABLE_AUTH;

// import controller
const { verifyJWT, authRole } = require("./controller/AuthController");

// import Routes
const routeLogin = require("./routes/login");
const routeUser = require("./routes/user");
const routeTeam = require("./routes/team");
// const routeAudio = require("./routes/audio");
const routeAudioNoAuth = require("./routes/audio-noauth");

// log file usign morgan
// create a write stream (append mode)
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "log\\access.log"),
  { flags: "a" }
);

// database connection - using mongoose
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/adam";

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false // skip warnings on find and modify
});

// to mongoose be acessible by model/User ?
mongoose.Promise = global.Promise
const connection = mongoose.connection;
connection.on("error", console.error.bind(console, "connection error:"));
let gfs;
connection.once("open", () => {
  // connected
  // var gfs = Grid(connection, mongo) // sem mongoose
  // gfs = Grid(connection.db, mongoose.mongo); // com mongoose (assign the driver mongoose.mongo)
  // gfs.collection("uploads");
  console.log("Connection to database estabilished");
});

let corsOptions = corsOptionsSocket.cors
corsOptions['optionsSuccessStatus'] = 200

console.log(corsOptions)

//enable pre-flight across-the-board
// app.options('*', cors())
// cors
// app.use(cors(corsOptions));
app.use(cors());

// middlewares
// app.use(express.json({ limit: '50mb' }); //??? for parsing application/json
app.use(express.json());
// app.use(express.urlencoded({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true })); // for parsing applications/x-www-form-urlencoded
// log middleware
app.use(morgan("combined", { stream: accessLogStream }));
app.use(morgan("combined"));

// socket.io test2
io.on("connection", (socket) => {
  // Log whenever a user connects
  console.log("user connected");
  console.log('socket.id CONNECTED: ', socket.id)
  console.log('io.sockets.adapter.rooms', io.sockets.adapter.rooms)
  let teamIdRoom = ''

  socket.on('clientMessageJoinTeamId', message => {
    teamIdRoom = message.message

    socket.join(teamIdRoom)
    console.log('teamId room to connect: ', message.message)
    console.log('socket.io rooms: ', socket.rooms)
    console.log('socket.sid JOIN ROOM: ', socket.id)
    console.log('io.sockets.adapter.rooms', io.sockets.adapter.rooms)
    // console.log('socket.clients JOIN: ', io.sockets.clients())
    // console.log('socket.clients ON ROOM: ', io.sockets.clients(teamIdRoom))
    socket.emit("serverMessage", { type: "join-teamId-room", text: teamIdRoom })
  })

  socket.on('clientMessageLeaveTeamId', message => {
    console.log('socket.id LEAVE ROOM: ', socket.id)
    console.log('io.sockets.adapter.rooms', io.sockets.adapter.rooms)
    teamIdRoom = message.message
    socket.leave(teamIdRoom)
    console.log('io.sockets.adapter.rooms', io.sockets.adapter.rooms)
    socket.emit("serverMessage", { type: "leave-teamId-room", text: teamIdRoom })
  })


  socket.on('logout', message => {
    socket.disconnect()
  })

  // socket.on('login', message => {
  //  
  // })

  socket.on('clientMessageNewAudio', message => {
    console.log('socket.id NEW AUDIO: ', socket.id)
    console.log('io.sockets.adapter.rooms', io.sockets.adapter.rooms)
    text = message.message
    userId = message.userId
    msgTime = (new Date).toLocaleTimeString()
    audioId = message.audioId
    setTimeout(() =>
      io.to(teamIdRoom).emit("serverMessage", { type: "new-audio-teamId-room", text: text, userId: userId, msgTime: msgTime, audioId: audioId })
      , 1000);
  })

  // Log whenever a client disconnects from our websocket server
  socket.on("disconnect", function () {
    console.log("user disconnected");
    console.log('socket.id DISCONNECTED: ', socket.id)
  });

  // When we receive a 'message' event from our client, print out
  // the contents of that message and then echo it back to our client
  // using `io.emit()`
  socket.on("clientMessage", message => {
    // console.log("Message Received: " + message);
    // console.log("Enviando para teamId room: ", teamIdRoom)
    // console.log('fim de lista de teamIdRoom')
    setTimeout(() =>
      io.to(teamIdRoom).emit("serverMessage", { type: "new-message", text: message })
      , 2000);
  });
});

// const upload = multer({ storage: storage });
// TODO: mover para routes
// TODO: verificar uso de  cors(corsOptions) aqui
app.post("/api/audio-noauth/audio_info", AudioController.add);
app.put("/api/audio-noauth/audio_listened/:id", AudioController.addListened);
app.get("/api/audio-noauth/", AudioController.list);
app.get("/api/audio-noauth/search", AudioController.search);

app.post('/api/audio-noauth/upload', function (req, res) {
  var form = new formidable.IncomingForm();
  form.multiples = true;
  form.uploadDir = __dirname + "/uploads";
  // form.uploadDir = __dirname; // TODO: testar alternativa folder para Heroku
  form.keepExtensions = true;
  let audioFileId = '';
  form.parse(req, async function (err, fields, files) {
    if (!err) {
      // console.log(fields.userId);
      // console.log(fields.teamId);
      // console.log(fields.name);
      // console.log('Files Uploaded: ' + files.file)

      Grid.mongo = mongoose.mongo;
      var gfs = Grid(connection.db);
      var writestream = gfs.createWriteStream({
        filename: files.file.name,
        // testes metadata
        // metadata: { user: '1', team: '2'}
      });
      fs.createReadStream(files.file.path).pipe(writestream);
      audioFileId = writestream.id;

      // gravar audio info
      // mock user e audio info
      let userId = fields.userId;
      let teamId = fields.teamId;
      let name = fields.name;
      let transcription = fields.transcription
      let duration = fields.duration
      // let created_at = new Date();

      let audio_info = {
        member: userId,
        team: teamId,
        name: name,
        transcription: transcription,
        created_at: new Date(),
        fileId: audioFileId,
        duration: duration
      }

      const newAudio = new Audio(audio_info);
      newAudio.save((err, audio) => {
        if (err) return console.error(err);
        // console.log(audio);
        // res.status(201).json(audio);
        console.log('new uploaded audioId', audio._id)
        // res.status(201)
        // res.write({ audioId: audio._id })
        res.status(201).send({ msg: 'Concluído upload de áudio no servidor', audioId: audio._id });
      });
    }
  });
  // form.on('end', function () {
  //   res.send({ msg: 'Concluído upload de áudio no servidor' });
  // });
});

// exemplo get audio file em banco
// https://grokonez.com/node-js/gridfs/nodejs-upload-download-files-to-mongodb-by-stream-based-gridfs-api-mongoose
app.get('/api/audio-in-db/:id', (req, res) => {
  // Check if file exists on MongoDB
  let id = req.params.id;
  Grid.mongo = mongoose.mongo;
  let gfs = Grid(connection.db);
  gfs.exist({ _id: id }, (err, file) => {
    if (err || !file) {
      res.status(404).send("Arquivo não encontrado")
    } else {
      gfs.createReadStream({ _id: id }).pipe(res)
    }
  })
});

// exemplo get audio file na pasta
// https://dev.to/abdisalan_js/how-to-code-a-video-streaming-server-using-nodejs-2o0
app.get("/api/audio-in-folder", function (req, res) {
  // Ensure there is a range given for the audio
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
  }

  // get audio stats (about 1MB?)
  const audioPath = __dirname + "/uploads/test7.weba";
  const audioSize = fs.statSync(audioPath).size;

  // Parse Range
  // Example: "bytes=32324-"
  // const CHUNK_SIZE = 10 ** 6; // 1MB
  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, audioSize - 1);

  // Create headers
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${audioSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "audio/webm; codecs=opus",
  };

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  // create audio read stream for this particular chunk
  const audioStream = fs.createReadStream(audioPath, { start, end });

  // Stream the audio chunk to the client
  audioStream.pipe(res);
});

// no auth routes for users not logged in
// app.use("/api/audio-noauth", routeAudioNoAuth);
// app.post("/api/audio-noauth/upload", (req, res, err) => {
//   res.send(req.files);
// });



// use routes (and api paths) after middlewares

if (enable_auth === 'true') {
  // login
  app.use("/api", routeLogin);
  // jwt auth
  app.use(verifyJWT);
} else {
  // login - to use register route
  app.use("/api", routeLogin);
  console.log("WARNING: AUTH DISABLED");
}

// // following routes use verifyJWT for authentication
app.use("/api/users", routeUser);
app.use("/api/teams", routeTeam);

let protocol = "http";
let host = process.env.HEROKU_APP_NAME || "localhost";
let port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server started at ${protocol}://${host}:${port}`);
  console.log(`root __dirname: ${__dirname}`);
});
