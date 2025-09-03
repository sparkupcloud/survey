const express = require("express");
const Router = express.Router();
const { upload } = require("../utils/helper");
const controller = require("../controller/user.controller");
const { authMiddleware } = require("../middleware/auth");

Router.post("/register", upload.single("profile"), controller.register);

Router.post("/login", controller.login);

Router.get("/getdataById", authMiddleware, controller.getDataById);

module.exports = Router;
