const mongoose = require("mongoose");

mongoose.Promise = global.Promise

const audioSchema = new mongoose.Schema(
  {
    name: String,
    transcription: String,
    created_at: Date,
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  {
    versionKey: false,
  }
);

const Audio = mongoose.model("Audio", audioSchema);

module.exports = Audio;