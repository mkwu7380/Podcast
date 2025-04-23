const express = require('express');
const apiRoutes = require('./routes/api');
const config = require('./config');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Use API routes
app.use(config.apiBaseUrl, apiRoutes);

// Start the server
app.listen(config.port, () => {
  console.log(`Podcast Scraper API server running at http://localhost:${config.port}`);
});