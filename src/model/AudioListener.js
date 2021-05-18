const mongoose = require("mongoose");

mongoose.Promise = global.Promise

const audioListenerSchema = new mongoose.Schema(
  {
    // created_at: Date,
    fileId: mongoose.Schema.Types.ObjectId,
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  {
    versionKey: false,
  }
);

const AudioListener = mongoose.model("AudioListener", audioListenerSchema);

module.exports = AudioListener;