const express = require("express");
const Router = express.Router();
const authRoutes = require("./auth.routes");
const reportRoutes = require("./reporting.routes");

Router.use('/auth', authRoutes);

Router.use("/report", reportRoutes);

module.exports = Router;