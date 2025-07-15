const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Setup Swagger documentation for the API
 * @param {Object} app - Express application instance
 */
function setupSwagger(app) {
  const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'Podcast REST API',
      version: '1.0.0',
      description: 'API for searching podcasts, fetching episodes, and transcribing audio.',
      contact: {
        name: 'API Support',
        email: 'support@podcastapi.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
    ],
    tags: [
      {
        name: 'Podcasts',
        description: 'Podcast search and episode management'
      },
      {
        name: 'Transcription',
        description: 'Audio transcription services'
      }
    ]
  };

  const options = {
    swaggerDefinition,
    apis: ['./routes/api.js'], // Path to the API docs (JSDoc comments)
  };

  const swaggerSpec = swaggerJsdoc(options);
  
  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Podcast API Documentation'
  }));

  // Serve swagger spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.json(swaggerSpec);
  });
}

module.exports = {
  setupSwagger
};
