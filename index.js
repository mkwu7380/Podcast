const express = require('express');
const { Server: WebSocketServer } = require('ws');
const path = require('path');

// Import configuration and routes
const config = require('./config');
const apiRoutes = require('./routes/api');
const transcriptionHandler = require('./src/websocket/transcriptionHandler');
const { setupSwagger } = require('./src/utils/swaggerConfig');

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.static('public'));

// Setup Swagger documentation
setupSwagger(app);

// Use API routes
app.use(config.apiBaseUrl, apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Podcast API'
  });
});

// Start HTTP server
const server = app.listen(config.port, () => {
  console.log(`🚀 Podcast API server running at http://localhost:${config.port}`);
  console.log(`📚 API Documentation available at http://localhost:${config.port}/api-docs`);
  console.log(`🔊 WebSocket endpoint: ws://localhost:${config.port}/ws/transcribe`);
});

// Setup WebSocket server for real-time transcription
const wss = new WebSocketServer({ 
  server, 
  path: '/ws/transcribe' 
});

wss.on('connection', (ws) => {
  transcriptionHandler.handleConnection(ws);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});