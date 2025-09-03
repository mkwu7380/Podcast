/**
 * Summary Generator Module
 * Core AI summary generation logic using Gemini models
 */

const modelManager = require('./modelManager');
const promptBuilder = require('./promptBuilder');
const aiConfig = require('./config');

class SummaryGenerator {
  /**
   * Generate summary from transcript text using Gemini AI
   * @param {string} transcript - The transcript text to summarize
   * @param {Object} options - Summary options
   * @returns {Promise<Object>} Summary result
   */
  async generateSummary(transcript, options = {}) {
    try {
      this.validateInput(transcript);

      // Get model and configuration
      const selectedModel = options.model || aiConfig.getDefaultModel();
      const geminiModel = modelManager.getModel(selectedModel);
      const modelInfo = aiConfig.getModelInfo(selectedModel);
      const generationConfig = modelManager.getGenerationConfig(selectedModel, options);

      // Build prompt
      const summaryType = options.type || 'comprehensive';
      const fullPrompt = promptBuilder.buildSummaryPrompt(transcript, summaryType, options.customPrompt);

      // Generate content using Gemini
      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig,
      });

      const response = await result.response;
      const aiSummary = response.text();
      
      this.validateOutput(aiSummary);

      return this.formatSummaryResult(aiSummary, summaryType, selectedModel, modelInfo);

    } catch (error) {
      const errorInfo = modelManager.handleProviderError(error, options.model);
      throw new Error(`Summary generation failed: ${errorInfo.suggestion}`);
    }
  }

  /**
   * Generate multiple summary variations
   * @param {string} transcript - Source transcript
   * @param {Array<string>} types - Summary types to generate
   * @returns {Promise<Object>} Multiple summary results
   */
  async generateMultipleSummaries(transcript, types = ['brief', 'detailed', 'bullet-points']) {
    const results = {};
    const errors = {};

    for (const type of types) {
      try {
        results[type] = await this.generateSummary(transcript, { type });
      } catch (error) {
        errors[type] = error.message;
      }
    }

    return {
      summaries: results,
      errors: Object.keys(errors).length > 0 ? errors : null,
      generatedAt: new Date().toISOString(),
      requestedTypes: types,
      successCount: Object.keys(results).length
    };
  }

  /**
   * Generate summary with retry logic
   * @param {string} transcript - Source transcript  
   * @param {Object} options - Generation options
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<Object>} Summary result
   */
  async generateWithRetry(transcript, options = {}, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await this.generateSummary(transcript, options);
      } catch (error) {
        lastError = error;
        
        if (attempt <= maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Validate input transcript
   * @param {string} transcript - Transcript to validate
   * @throws {Error} If transcript is invalid
   */
  validateInput(transcript) {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is empty or invalid');
    }
    
    if (typeof transcript !== 'string') {
      throw new Error('Transcript must be a string');
    }
    
    if (transcript.length > 100000) { // 100k character limit
      throw new Error('Transcript too long for processing');
    }
  }

  /**
   * Validate AI-generated output
   * @param {string} summary - Generated summary
   * @throws {Error} If summary is invalid
   */
  validateOutput(summary) {
    if (!summary || summary.trim().length === 0) {
      throw new Error('No summary generated from AI service');
    }
    
    if (summary.length < 10) {
      throw new Error('Generated summary is too short');
    }
  }

  /**
   * Format summary result object
   * @param {string} aiSummary - Raw AI summary
   * @param {string} summaryType - Type of summary
   * @param {string} selectedModel - Model used
   * @param {Object} modelInfo - Model information
   * @returns {Object} Formatted result
   */
  formatSummaryResult(aiSummary, summaryType, selectedModel, modelInfo) {
    const cleanSummary = aiSummary.trim();
    
    return {
      summary: cleanSummary,
      type: summaryType,
      wordCount: cleanSummary.split(' ').length,
      characterCount: cleanSummary.length,
      model: selectedModel,
      modelName: modelInfo.name,
      generatedAt: new Date().toISOString(),
      metadata: {
        modelMaxTokens: modelInfo.maxTokens,
        modelBestFor: modelInfo.bestFor,
        processingTime: Date.now() // Simplified - would need proper timing in production
      }
    };
  }

  /**
   * Estimate processing time and cost (for planning)
   * @param {string} transcript - Source transcript
   * @param {Object} options - Generation options
   * @returns {Object} Estimation data
   */
  estimateProcessing(transcript, options = {}) {
    const model = options.model || aiConfig.getDefaultModel();
    const modelInfo = aiConfig.getModelInfo(model);
    const wordCount = transcript.split(' ').length;
    
    // Rough estimates (would be refined with actual usage data)
    const estimatedTokens = Math.ceil(wordCount * 1.3); // ~1.3 tokens per word
    const estimatedTime = Math.max(2, Math.ceil(estimatedTokens / 1000)); // seconds
    
    return {
      model,
      inputWordCount: wordCount,
      estimatedInputTokens: estimatedTokens,
      estimatedProcessingTime: estimatedTime,
      modelLimits: {
        maxTokens: modelInfo.maxTokens,
        withinLimits: estimatedTokens <= modelInfo.maxTokens
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get generator status and capabilities
   * @returns {Object} Status information
   */
  getStatus() {
    const modelStatus = modelManager.getModelStatus();
    const configStatus = aiConfig.isGeminiConfigured();
    
    return {
      available: configStatus,
      models: modelStatus,
      capabilities: {
        summaryTypes: ['brief', 'detailed', 'bullet-points', 'comprehensive', 'focused'],
        supportsBatch: true,
        supportsRetry: true,
        maxTranscriptLength: 100000,
        estimationAvailable: true
      },
      lastChecked: new Date().toISOString()
    };
  }
}

module.exports = new SummaryGenerator();
