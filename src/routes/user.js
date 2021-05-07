require('dotenv-safe').config();

// disable auth on .env only for quick tests purpose
const enable_auth = process.env.ENABLE_AUTH;
// utilizando classe express.Router()
let express = require("express");
let router = express.Router();
const controller = require("../controller/UserController");
const { authRole } = require("../controller/AuthController");

if (enable_auth === 'true') {
  // use /search before /:id
  router.get("/", authRole(["admin"]), controller.list);
  router.post("/", authRole(["admin"]), controller.add);
  router.get("/search", authRole(["admin"]), controller.search);
  router.get("/:id", authRole(['admin']), controller.get_by_id);
  router.put("/:id", controller.alter);
  router.delete("/:id", authRole(['admin']), controller.remove);
}
else {
  console.log("WARNING: USER AUTH_ROLE DISABLED")
  router.get("/", controller.list);
  router.post("/", controller.add);
  router.get("/search", controller.search);
  router.get("/:id", controller.get_by_id);
  router.put("/:id", controller.alter);
  router.delete("/:id", controller.remove);
}


module.exports = router;
