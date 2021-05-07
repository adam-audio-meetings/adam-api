// utilizando classe express.Router()
let express = require("express");
let router = express.Router();
const controller = require("../controller/LoginController");


router.post("/login", controller.login);
router.get("/logout", controller.logout);
router.post("/register", controller.signin);


module.exports = router;
