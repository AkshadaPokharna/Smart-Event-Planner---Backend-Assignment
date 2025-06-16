const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const axios = require('axios');

// 🔒 Environment variable
const apiKey = process.env.OPENWEATHER_API_KEY;

// -------------------------
// 1. Create a new event
// -------------------------
router.post('/', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// -------------------------
// 2. Get all events
// -------------------------
router.get('/', async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

// ------------------------------------------------------------
// 3. ✅ GET weather for specific location and date (IMPORTANT)
// ------------------------------------------------------------
router.get('/weather/:location/:date', async (req, res) => {
  try {
    const { location, date } = req.params;
    const encodedLocation = encodeURIComponent(location);

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodedLocation}&appid=${apiKey}&units=metric`;
    const response = await axios.get(url);

    const match = response.data.list.find(f => f.dt_txt.startsWith(date));
    if (!match) {
      return res.status(404).json({ error: 'No forecast found for this date' });
    }

    res.json({
      location,
      date,
      description: match.weather[0].description,
      temperature: match.main.temp,
      wind: match.wind.speed
    });
  } catch (err) {
    res.status(500).json({ error: 'Weather lookup failed', details: err.message });
  }
});

// -------------------------
// 4. Weather for event ID
// -------------------------
router.get('/:id/weather', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const location = encodeURIComponent(event.location);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

    const response = await axios.get(url);
    const weather = {
      location: event.location,
      description: response.data.weather[0].description,
      temperature: response.data.main.temp
    };

    res.json(weather);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

// ---------------------------------
// 5. Analyze weather and suitability
// ---------------------------------
router.post('/:id/weather-check', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const location = encodeURIComponent(event.location);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

    const response = await axios.get(url);
    const { temp } = response.data.main;
    const wind = response.data.wind.speed;
    const description = response.data.weather[0].description;

    let score = 0;
    if (event.eventType === 'Outdoor Sports') {
      if (temp >= 15 && temp <= 30) score += 30;
      if (description.includes('clear') || description.includes('cloud')) score += 25;
      if (wind < 20) score += 20;
    }

    let suitability = 'Poor';
    if (score > 70) suitability = 'Good';
    else if (score > 40) suitability = 'Okay';

    res.json({
      event: event.title,
      location: event.location,
      date: event.date,
      weather: { temperature: temp, description, wind },
      score,
      suitability
    });
  } catch (err) {
    res.status(500).json({ error: 'Weather check failed' });
  }
});

// -------------------------
// 6. Get suitability score
// -------------------------
router.get('/:id/suitability', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const location = encodeURIComponent(event.location);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

    const response = await axios.get(url);
    const { temp } = response.data.main;
    const wind = response.data.wind.speed;
    const description = response.data.weather[0].description;

    let score = 0;
    if (event.eventType === 'Outdoor Sports') {
      if (temp >= 15 && temp <= 30) score += 30;
      if (description.includes('clear') || description.includes('cloud')) score += 25;
      if (wind < 20) score += 20;
    }

    let suitability = 'Poor';
    if (score > 70) suitability = 'Good';
    else if (score > 40) suitability = 'Okay';

    res.json({ score, suitability });
  } catch (err) {
    res.status(500).json({ error: 'Suitability check failed' });
  }
});

// -------------------------
// 7. Update event by ID
// -------------------------
router.put('/:id', async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// -------------------------
// 8. Alternatives for weather
// -------------------------
router.get('/:id/alternatives', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const location = encodeURIComponent(event.location);
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric`;

    const response = await axios.get(url);
    const forecasts = response.data.list;

    const alternatives = forecasts
      .filter(f => f.dt_txt.includes('12:00:00'))
      .map(f => {
        const temp = f.main.temp;
        const desc = f.weather[0].description;
        const wind = f.wind.speed;

        let score = 0;
        if (event.eventType === 'Outdoor Sports') {
          if (temp >= 15 && temp <= 30) score += 30;
          if (desc.includes('clear') || desc.includes('cloud')) score += 25;
          if (wind < 20) score += 20;
        }

        return {
          date: f.dt_txt,
          temp,
          desc,
          wind,
          score
        };
      })
      .filter(a => a.score >= 50)
      .sort((a, b) => b.score - a.score);

    res.json({ alternatives });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get alternatives' });
  }
});

module.exports = router;
