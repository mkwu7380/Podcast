/**
 * AI Service Configuration Module
 * Handles API keys, model definitions, and provider setup
 */

class AIConfig {
  constructor() {
    // API Configuration
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.cohereApiKey = process.env.COHERE_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.groqApiKey = process.env.GROQ_API_KEY;
    
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    
    // Available Gemini models with their characteristics
    this.availableModels = {
      'gemini-1.5-flash': {
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient for most tasks',
        maxTokens: 8192,
        bestFor: 'Quick summaries, general content'
      },
      'gemini-1.5-pro': {
        name: 'Gemini 1.5 Pro', 
        description: 'Advanced reasoning and complex analysis',
        maxTokens: 32768,
        bestFor: 'Complex analysis, detailed summaries'
      },
      'gemini-1.0-pro': {
        name: 'Gemini 1.0 Pro',
        description: 'Reliable baseline model',
        maxTokens: 4096,
        bestFor: 'Standard text processing'
      }
    };
  }

  /**
   * Get available models information
   */
  getAvailableModels() {
    return this.availableModels;
  }

  /**
   * Get default model name
   */
  getDefaultModel() {
    return this.defaultModel;
  }

  /**
   * Validate if model exists
   */
  isValidModel(modelName) {
    return !!this.availableModels[modelName];
  }

  /**
   * Get model info by name
   */
  getModelInfo(modelName) {
    return this.availableModels[modelName] || null;
  }

  /**
   * Check if Gemini is configured
   */
  isGeminiConfigured() {
    return !!this.geminiApiKey;
  }

  /**
   * Get API keys (for internal use)
   */
  getAPIKeys() {
    return {
      gemini: this.geminiApiKey,
      cohere: this.cohereApiKey, 
      openai: this.openaiApiKey,
      groq: this.groqApiKey
    };
  }
}

module.exports = new AIConfig();
