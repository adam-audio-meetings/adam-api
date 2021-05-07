const mongoose = require("mongoose");

mongoose.Promise = global.Promise

const teamSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    description: String,
    coordinator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  {
    versionKey: false,
  }
);

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;