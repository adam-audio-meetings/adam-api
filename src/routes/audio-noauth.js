let express = require("express");
let router = express.Router();
const controller = require("../controller/AudioController");

// router.get("/", controller.list);
router.post("/", controller.list);
// router.get("/search", controller.search);
// router.get("/:id", controller.get_by_id);

module.exports = router;