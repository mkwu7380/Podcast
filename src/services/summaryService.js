const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Service for AI-powered podcast summarization using Google Gemini
 */
class SummaryService {
  constructor() {
    // Configure Gemini AI service
    this.geminiApiKey = process.env.GEMINI_API_KEY;
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
    
    if (this.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
      // Don't create a model instance here - create dynamically per request
    }
  }

  /**
   * Get a Gemini model instance for the specified model
   * @param {string} modelName - Name of the model to use
   * @returns {Object} Gemini model instance
   */
  getModel(modelName = null) {
    const selectedModel = modelName || this.defaultModel;
    
    if (!this.availableModels[selectedModel]) {
      throw new Error(`Unsupported model: ${selectedModel}. Available models: ${Object.keys(this.availableModels).join(', ')}`);
    }
    
    if (!this.genAI) {
      throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.');
    }
    
    return this.genAI.getGenerativeModel({ model: selectedModel });
  }

  /**
   * Get available models information
   * @returns {Object} Available models with their details
   */
  getAvailableModels() {
    return this.availableModels;
  }

  /**
   * Generate summary from transcript text
   * @param {string} transcript - The transcript text to summarize
   * @param {Object} options - Summary options (type, model, maxTokens, temperature, etc.)
   * @returns {Promise<Object>} Summary result
   */
  async generateSummary(transcript, options = {}) {
    try {
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcript is empty or invalid');
      }

      if (!this.geminiApiKey) {
        // Fallback to basic text summarization if no Gemini API key
        return this.generateBasicSummary(transcript, options);
      }

      // Get the specified model or use default
      const selectedModel = options.model || this.defaultModel;
      const geminiModel = this.getModel(selectedModel);
      const modelInfo = this.availableModels[selectedModel];

      const summaryType = options.type || 'comprehensive';
      const systemPrompt = 'You are an expert podcast summarizer. Create clear, structured summaries that capture key insights and main points.';
      const userPrompt = this.buildSummaryPrompt(transcript, summaryType);
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      // Configure generation parameters with model-specific limits
      const maxTokensLimit = Math.min(
        options.maxTokens || 1000,
        modelInfo.maxTokens
      );
      
      const generationConfig = {
        temperature: options.temperature || 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: maxTokensLimit,
      };

      // Generate content using the selected Gemini model
      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig,
      });

      const response = await result.response;
      const aiSummary = response.text();
      
      if (!aiSummary || aiSummary.trim().length === 0) {
        throw new Error('No summary generated from Gemini service');
      }

      return {
        summary: aiSummary.trim(),
        type: summaryType,
        wordCount: aiSummary.split(' ').length,
        model: selectedModel,
        modelName: modelInfo.name,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Gemini Summary generation failed:', error.message);
      
      // Handle Gemini-specific errors
      if (error.message?.includes('API key')) {
        throw new Error('Gemini API authentication failed. Please check your API key.');
      } else if (error.message?.includes('quota') || error.message?.includes('rate')) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('SAFETY')) {
        throw new Error('Content filtered by Gemini safety settings. Try with different content.');
      } else {
        // Fallback to basic summary
        console.warn('Falling back to basic summary due to Gemini error:', error.message);
        return this.generateBasicSummary(transcript, options);
      }
    }
  }

  /**
   * Generate podcast episode summary with key sections
   * @param {string} transcript - Episode transcript
   * @param {Object} episodeInfo - Episode metadata
   * @returns {Promise<Object>} Structured episode summary
   */
  async generateEpisodeSummary(transcript, episodeInfo = {}) {
    try {
      const summaryPrompts = {
        overview: 'Provide a 2-3 sentence overview of this podcast episode',
        keyPoints: 'List the 5-7 most important points or insights discussed',
        topics: 'Identify the main topics and themes covered',
        quotes: 'Extract 2-3 most impactful or memorable quotes',
        actionItems: 'Identify any actionable advice or recommendations mentioned'
      };

      const summaries = {};

      for (const [section, prompt] of Object.entries(summaryPrompts)) {
        try {
          const result = await this.generateSummary(transcript, {
            type: 'focused',
            customPrompt: `${prompt}: ${transcript.slice(0, 4000)}...`,
            maxTokens: section === 'overview' ? 150 : 300
          });
          summaries[section] = result.summary;
        } catch (error) {
          console.warn(`Failed to generate ${section} summary:`, error.message);
          summaries[section] = `Unable to generate ${section} summary`;
        }
      }

      return {
        episode: {
          title: episodeInfo.title || 'Unknown Episode',
          publishDate: episodeInfo.pubDate || null,
          duration: episodeInfo.duration || null
        },
        summary: summaries,
        transcriptLength: transcript.length,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Episode summary generation failed: ${error.message}`);
    }
  }

  /**
   * Build appropriate prompt based on summary type
   */
  buildSummaryPrompt(transcript, type) {
    const basePrompt = `Please summarize the following podcast transcript:\n\n${transcript.slice(0, 8000)}`;
    
    switch (type) {
      case 'brief':
        return `${basePrompt}\n\nProvide a brief 2-3 sentence summary focusing on the main topic and key takeaway.`;
      
      case 'detailed':
        return `${basePrompt}\n\nProvide a detailed summary including:\n- Main topics discussed\n- Key insights and conclusions\n- Important quotes or statements\n- Actionable advice mentioned`;
      
      case 'bullet-points':
        return `${basePrompt}\n\nProvide a bullet-point summary with:\n- Main topic\n- 5-7 key points discussed\n- Notable quotes\n- Conclusions or recommendations`;
      
      default: // comprehensive
        return `${basePrompt}\n\nProvide a comprehensive summary that captures the essence of this podcast episode, including main themes, key insights, and important takeaways.`;
    }
  }

  /**
   * Fallback basic summarization without AI
   */
  generateBasicSummary(transcript, options = {}) {
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const wordCount = transcript.split(' ').length;
    
    // Extract first few and last few sentences as a basic summary
    const summaryLength = Math.min(5, Math.floor(sentences.length * 0.1));
    const firstSentences = sentences.slice(0, Math.ceil(summaryLength / 2));
    const lastSentences = sentences.slice(-Math.floor(summaryLength / 2));
    
    const basicSummary = [...firstSentences, ...lastSentences].join('. ') + '.';

    return {
      summary: basicSummary,
      type: 'basic',
      wordCount: basicSummary.split(' ').length,
      model: 'basic-extraction',
      generatedAt: new Date().toISOString(),
      note: 'This is a basic summary. For AI-powered summaries, configure a Gemini API key.'
    };
  }

  /**
   * Validate Gemini AI service configuration
   */
  isAiConfigured() {
    return !!(this.geminiApiKey && this.genAI);
  }

  /**
   * Get Gemini provider status
   */
  getAIProviderStatus() {
    return {
      provider: 'Google Gemini',
      defaultModel: this.defaultModel,
      availableModels: Object.keys(this.availableModels),
      modelDetails: this.availableModels,
      configured: this.isAiConfigured(),
      apiKeySet: !!this.geminiApiKey
    };
  }
}

module.exports = new SummaryService();
