const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /events/:id/weather
router.get('/:id/weather', async (req, res) => {
  try {
    const eventId = req.params.id;

    // Find the event from DB (assumes you have a model)
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const city = event.location; // assuming `location` is city name
    const apiKey = process.env.OPENWEATHER_API_KEY;

    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );

    res.json({
      event: event.name,
      location: city,
      weather: weatherRes.data.weather[0].description,
      temperature: weatherRes.data.main.temp,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

module.exports = router;
