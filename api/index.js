// Vercel serverless function wrapper
const express = require('express');
const path = require('path');

// Import your existing app
const config = require('../config');
const apiRoutes = require('../routes/api');

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// API routes
app.use(config.apiBaseUrl, apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Podcast API'
  });
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith(config.apiBaseUrl) || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

module.exports = app;
