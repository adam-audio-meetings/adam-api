let express = require("express");
let router = express.Router();
const controller = require("../controller/TeamController");
const { authRole } = require("../controller/AuthController");

// todo: define roles
router.get("/", controller.list);
router.get("/own", authRole(['coordinator', 'member']), controller.listOwn);
router.get("/available", authRole(['coordinator', 'member']), controller.listAvailable);
router.get("/search", controller.search);
router.get("/:id", controller.get_by_id);

router.post("/subscribe", authRole(['member']), controller.subscribe);
router.post("/unsubscribe", authRole(['member']), controller.unsubscribe);

router.post("/", authRole(['coordinator']), controller.add);

router.put("/:id", controller.alter);
router.delete("/:id", controller.remove);

module.exports = router;