const express = require('express');
const { Server: WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');

// Import configuration and routes
const config = require('./config');
const apiRoutes = require('./routes/api');
const transcriptionHandler = require('./websocket/transcriptionHandler');
const { setupSwagger } = require('./utils/swaggerConfig');

const app = express();

// Middleware setup
app.use(express.json());
// Serve client app - prefer built assets in dist if available
const clientDistPath = path.join(__dirname, '../client/dist');
const clientPublicPath = path.join(__dirname, '../client/public');
// Only use dist if the built index.html exists; otherwise fall back to public
const distIndexPath = path.join(clientDistPath, 'index.html');
const clientServePath = fs.existsSync(distIndexPath) ? clientDistPath : clientPublicPath;
app.use(express.static(clientServePath));
console.log(`🧩 Serving client from: ${clientServePath.includes('/dist') ? 'client/dist' : 'client/public'}`);

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

// SPA fallback to index.html for client-side routing
app.get('*', (req, res, next) => {
  // Avoid intercepting API, docs, or websocket paths
  const url = req.originalUrl;
  if (url.startsWith(config.apiBaseUrl) || url.startsWith('/api-docs') || url.startsWith('/ws')) {
    return next();
  }
  res.sendFile(path.join(clientServePath, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Podcast API server running at http://localhost:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Increase server timeout for long-running transcription operations
server.timeout = 600000; // 10 minutes

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