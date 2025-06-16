const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/:location/:date', async (req, res) => {
  const { location, date } = req.params;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
    const response = await axios.get(url);

    const targetDate = new Date(date).toDateString();
    const forecast = response.data.list.find(entry =>
      new Date(entry.dt_txt).toDateString() === targetDate
    );

    if (!forecast) {
      return res.status(404).json({ error: 'No forecast available for this date' });
    }

    res.json({
      location,
      date: forecast.dt_txt,
      temperature: forecast.main.temp,
      description: forecast.weather[0].description,
      wind: forecast.wind.speed
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

module.exports = router;
