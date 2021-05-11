const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const morgan = require("morgan");

const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');

const crypto = require('crypto');
const Grid = require('gridfs-stream');
var formidable = require("formidable");
require('dotenv-safe').config();


// disable auth on .env only for quick tests purpose
const enable_auth = process.env.ENABLE_AUTH;

// import controller
const { verifyJWT, authRole } = require("./controller/AuthController");

// import Routes
const routeLogin = require("./routes/login");
const routeUser = require("./routes/user");
const routeTeam = require("./routes/team");
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

// cors
app.use(cors());

// middlewares
// app.use(express.json({ limit: '50mb' }); //??? for parsing application/json
app.use(express.json());
// app.use(express.urlencoded({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true })); // for parsing applications/x-www-form-urlencoded
// log middleware
app.use(morgan("combined", { stream: accessLogStream }));
app.use(morgan("combined"));



// Storage engine
// const storage = new GridFsStorage({
//   url: mongoURI,
//   options: {
//    useNewUrlParser: true,
//    useUnifiedTopology: true
//   },
//   file: (req, file) => {
//     return new Promise((resolve, reject) => {
//       crypto.randomBytes(16, (err, buf) => {
//         if (err) {
//           return reject(err);
//         }
//           console.log('inside audio-noauth storage')
//         const filename = file.originalname;
//         const fileInfo = {
//           filename: filename,
//           bucketName: "uploads"
//         };
//         resolve(fileInfo);
//       })
//     })
//   }
// });

// const upload = multer({ storage: storage });



app.post('/api/audio-noauth/upload', function (req, res) {
  var form = new formidable.IncomingForm();
  form.uploadDir = __dirname+"/uploads";
  form.keepExtensions = true;
  form.parse(req, function (err, fields, files) {
      if (!err) {
          console.log('Files Uploaded: ' + files.file)
          Grid.mongo = mongoose.mongo;
          var gfs = Grid(connection.db);
          var writestream = gfs.createWriteStream({
              filename: files.file.name
          });
          fs.createReadStream(files.file.path).pipe(writestream);
      }
  });
  form.on('end', function () {
      res.send('Completed ... go check fs.files & fs.chunks in mongodb');
  });
});


// no auth routes fos users not logged in
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

app.listen(port, () => {
  console.log(`Server started at ${protocol}://${host}:${port}`);
});
