const mongoose = require("mongoose");

mongoose.Promise = global.Promise

const userSchema = new mongoose.Schema(
  {
    role: String,
    name: String,
    avatar: String,
    username: String,
    password: String,
    email: String,
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }]
  },
  {
    versionKey: false,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
