let express = require("express");
let router = express.Router();
const controller = require("../controller/TeamController");

// todo: define roles
router.get("/", controller.list);
router.get("/search", controller.search);
router.get("/:id", controller.get_by_id);

module.exports = router;