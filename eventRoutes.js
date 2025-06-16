const express = require("express");
const router = express.Router();
const controller = require("../controllers/eventController");

router.post("/events", controller.createEvent);
router.get("/events", controller.getAllEvents);
router.post("/events/:id/weather-check", controller.weatherCheck);

module.exports = router;
