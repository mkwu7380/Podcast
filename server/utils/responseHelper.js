/**
 * Utility functions for creating consistent API responses
 */

/**
 * Create a successful response object
 * @param {Object} data - Response data
 * @param {string} message - Optional success message
 * @returns {Object} Formatted response object
 */
function createResponse(data, message = null) {
  const response = {
    success: true,
    ...data
  };
  
  if (message) {
    response.message = message;
  }
  
  return response;
}

/**
 * Create an error response object
 * @param {string} error - Error message
 * @param {Object} details - Optional error details
 * @returns {Object} Formatted error response object
 */
function createErrorResponse(error, details = null) {
  const response = {
    success: false,
    error
  };
  
  if (details) {
    response.details = details;
  }
  
  return response;
}

module.exports = {
  createResponse,
  createErrorResponse
};
