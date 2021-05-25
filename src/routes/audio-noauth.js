let express = require("express");
let router = express.Router();
const controller = require("../controller/AudioController");




router.get("/", controller.list);
// router.post("/audio_info", controller.add);
//router.post("/upload", controller.add);
router.get("/search", controller.search);
router.get("/:id", controller.get_by_id);
// router.get("/team/:idTeam/date/:date", controller.get_by_team_and_date);

module.exports = router;