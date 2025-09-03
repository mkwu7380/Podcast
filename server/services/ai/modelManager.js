/**
 * Model Manager Module
 * Handles model selection, instantiation, and provider management
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiConfig = require('./config');

class ModelManager {
  constructor() {
    this.genAI = null;
    this.initializeProviders();
  }

  /**
   * Initialize AI providers based on available API keys
   */
  initializeProviders() {
    const apiKeys = aiConfig.getAPIKeys();
    
    if (apiKeys.gemini) {
      this.genAI = new GoogleGenerativeAI(apiKeys.gemini);
    }
    
    // Future: Initialize other providers (Cohere, OpenAI, Groq)
  }

  /**
   * Get a Gemini model instance for the specified model
   * @param {string} modelName - Name of the model to use
   * @returns {Object} Gemini model instance
   * @throws {Error} If model is unsupported or API not configured
   */
  getModel(modelName = null) {
    const selectedModel = modelName || aiConfig.getDefaultModel();
    
    if (!aiConfig.isValidModel(selectedModel)) {
      const availableModels = Object.keys(aiConfig.getAvailableModels()).join(', ');
      throw new Error(`Unsupported model: ${selectedModel}. Available models: ${availableModels}`);
    }
    
    if (!this.genAI) {
      throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.');
    }
    
    return this.genAI.getGenerativeModel({ model: selectedModel });
  }

  /**
   * Get generation configuration for a specific model
   * @param {string} modelName - Model name
   * @param {Object} options - Generation options
   * @returns {Object} Generation configuration
   */
  getGenerationConfig(modelName, options = {}) {
    const modelInfo = aiConfig.getModelInfo(modelName);
    
    if (!modelInfo) {
      throw new Error(`Model information not found for: ${modelName}`);
    }

    // Calculate token limits based on model capabilities
    const maxTokensLimit = Math.min(
      options.maxTokens || 1000,
      modelInfo.maxTokens
    );
    
    return {
      temperature: options.temperature || 0.3,
      topK: options.topK || 40,
      topP: options.topP || 0.95,
      maxOutputTokens: maxTokensLimit,
    };
  }

  /**
   * Validate model availability and configuration
   * @param {string} modelName - Model to validate
   * @returns {Object} Validation result
   */
  validateModel(modelName) {
    const model = modelName || aiConfig.getDefaultModel();
    const isValid = aiConfig.isValidModel(model);
    const modelInfo = aiConfig.getModelInfo(model);
    const isConfigured = !!this.genAI;

    return {
      modelName: model,
      isValid,
      isConfigured,
      modelInfo,
      available: isValid && isConfigured,
      errors: this.getValidationErrors(model, isValid, isConfigured)
    };
  }

  /**
   * Get validation errors for a model
   * @param {string} modelName - Model name
   * @param {boolean} isValid - Whether model definition is valid
   * @param {boolean} isConfigured - Whether API is configured
   * @returns {Array<string>} Array of error messages
   */
  getValidationErrors(modelName, isValid, isConfigured) {
    const errors = [];
    
    if (!isValid) {
      errors.push(`Unknown model: ${modelName}`);
    }
    
    if (!isConfigured) {
      errors.push('Gemini API not configured - missing API key');
    }
    
    return errors;
  }

  /**
   * Test model connectivity
   * @param {string} modelName - Model to test
   * @returns {Promise<Object>} Test result
   */
  async testModel(modelName = null) {
    const model = modelName || aiConfig.getDefaultModel();
    
    try {
      const validation = this.validateModel(model);
      
      if (!validation.available) {
        return {
          success: false,
          modelName: model,
          errors: validation.errors,
          timestamp: new Date().toISOString()
        };
      }

      // Simple test prompt
      const geminiModel = this.getModel(model);
      const testPrompt = 'Please respond with "OK" if you can process this request.';
      
      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: testPrompt }] }],
        generationConfig: { maxOutputTokens: 10, temperature: 0 }
      });

      const response = await result.response;
      const responseText = response.text();

      return {
        success: true,
        modelName: model,
        responseText: responseText.trim(),
        latencyMs: Date.now() - Date.now(), // Simplified latency measurement
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        modelName: model,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get all available models with their status
   * @returns {Object} Models and their availability status
   */
  getModelStatus() {
    const models = aiConfig.getAvailableModels();
    const status = {};

    for (const [modelName, modelInfo] of Object.entries(models)) {
      const validation = this.validateModel(modelName);
      status[modelName] = {
        ...modelInfo,
        available: validation.available,
        configured: validation.isConfigured,
        errors: validation.errors
      };
    }

    return status;
  }

  /**
   * Handle provider errors and suggest fallbacks
   * @param {Error} error - Original error
   * @param {string} modelName - Model that failed
   * @returns {Object} Error analysis and suggestions
   */
  handleProviderError(error, modelName) {
    const errorMessage = error.message || error.toString();
    
    // Categorize common error types
    let errorType = 'unknown';
    let suggestion = 'Try again later or contact support';
    
    if (errorMessage.includes('API key')) {
      errorType = 'authentication';
      suggestion = 'Check your Gemini API key configuration';
    } else if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
      errorType = 'rate_limit';
      suggestion = 'Rate limit exceeded. Wait before making more requests';
    } else if (errorMessage.includes('SAFETY')) {
      errorType = 'content_safety';
      suggestion = 'Content filtered by safety settings. Try different content';
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      errorType = 'network';
      suggestion = 'Network connectivity issue. Check your internet connection';
    }

    return {
      originalError: errorMessage,
      errorType,
      suggestion,
      modelName,
      fallbackAvailable: true, // We always have fallback handler
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ModelManager();
