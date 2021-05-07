const mongoose = require("mongoose");

mongoose.Promise = global.Promise

const audioSchema = new mongoose.Schema(
  {
    name: String,
    transcription: String,
    created: Date,
    file: Blob,
    member: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  {
    versionKey: false,
  }
);

const Audio = mongoose.model("Audio", audioSchema);

module.exports = Audio;