require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const eventRoutes = require('./routes/events');

app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Use the events route
app.use('/api/events', eventRoutes);

// Default fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
