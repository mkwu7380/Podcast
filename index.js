const express = require('express');
const apiRoutes = require('./routes/api');
const config = require('./config');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static('public'));

// --- Swagger UI Setup ---
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Podcast REST API',
    version: '1.0.0',
    description: 'API for searching podcasts, fetching episodes, and transcribing audio.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./routes/api.js'], // Path to the API docs (JSDoc comments)
};
const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// --- End Swagger UI Setup ---

// Use API routes
app.use(config.apiBaseUrl, apiRoutes);

// Start the server
app.listen(config.port, () => {
  console.log(`Podcast Scraper API server running at http://localhost:${config.port}`);
});