/**
 * Summary Service - Main Orchestrator (Modular Architecture)
 * Coordinates all AI summary modules to prevent LLM hallucination
 */

const aiConfig = require('./ai/config');
const modelManager = require('./ai/modelManager');
const promptBuilder = require('./ai/promptBuilder');
const summaryGenerator = require('./ai/summaryGenerator');
const episodeSummary = require('./ai/episodeSummary');
const fallbackHandler = require('./ai/fallbackHandler');
const statusManager = require('./ai/statusManager');

/**
 * Main Summary Service - Lightweight orchestrator
 */
class SummaryService {
  constructor() {
    // All heavy lifting is done by specialized modules
    this.initialized = true;
  }

  /**
   * Generate summary from transcript text
   * @param {string} transcript - The transcript text to summarize
   * @param {Object} options - Summary options (type, model, maxTokens, temperature, etc.)
   * @returns {Promise<Object>} Summary result
   */
  async generateSummary(transcript, options = {}) {
    try {
      // Input validation through prompt builder
      if (!promptBuilder.isValidTranscript(transcript)) {
        throw new Error('Transcript is empty or invalid');
      }

      // Check if AI is configured, otherwise use fallback
      if (!statusManager.isAiConfigured()) {
        console.warn('AI not configured, using fallback summary generation');
        return fallbackHandler.generateBasicSummary(transcript, options);
      }

      // Use the summary generator module
      return await summaryGenerator.generateSummary(transcript, options);

    } catch (error) {
      console.error('Summary generation failed:', error.message);
      
      // Intelligent fallback based on error type
      if (this.shouldUseFallback(error)) {
        console.warn('Falling back to basic summary due to error:', error.message);
        return fallbackHandler.generateBasicSummary(transcript, options);
      }
      
      throw error;
    }
  }

  /**
   * Generate podcast episode summary with structured sections using chunked approach
   * @param {string} transcript - Episode transcript
   * @param {Object} episodeInfo - Episode metadata
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Structured episode summary
   */
  async generateEpisodeSummary(transcript, episodeInfo = {}, options = {}) {
    try {
      // For long transcripts, use chunked summarization approach
      if (transcript.split(' ').length > 2400) {
        return await this.generateChunkedEpisodeSummary(transcript, episodeInfo, options);
      }
      
      // For shorter transcripts, use direct summarization
      return await episodeSummary.generateEpisodeSummary(transcript, episodeInfo, options);
    } catch (error) {
      throw new Error(`Episode summary generation failed: ${error.message}`);
    }
  }

  /**
   * Generate episode summary using chunked approach for long transcripts
   * @param {string} transcript - Full episode transcript  
   * @param {Object} episodeInfo - Episode metadata
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Comprehensive episode summary
   */
  async generateChunkedEpisodeSummary(transcript, episodeInfo = {}, options = {}) {
    try {
      console.log('Using chunked summarization for long transcript');
      
      // Step 1: Split transcript into larger chunks suitable for podcast content
      const totalWords = transcript.split(' ').length;
      const chunkSize = Math.max(800, Math.floor(totalWords / 3)); // At least 800 words per chunk, or 1/3 of content
      const chunks = this.splitTranscriptIntoChunks(transcript, chunkSize);
      console.log(`Split transcript into ${chunks.length} chunks`);
      
      // Step 2: Generate summary for each chunk
      const chunkSummaries = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);
        
        try {
          const chunkSummary = await summaryGenerator.generateSummary(chunks[i], {
            type: 'brief',
            maxTokens: 200,
            customPrompt: `Analyze this part of a podcast episode and provide:
1. A brief 2-3 sentence summary of key points
2. 3-5 most important keywords (comma-separated)

Format your response as:
SUMMARY: [your summary here]
KEYWORDS: [keyword1, keyword2, keyword3, ...]`
          });
          
          // Parse the response to extract summary and keywords
          const responseText = chunkSummary.summary || '';
          const summaryMatch = responseText.match(/SUMMARY:\s*(.*?)(?=KEYWORDS:|$)/s);
          const keywordsMatch = responseText.match(/KEYWORDS:\s*(.*?)$/s);
          
          const extractedSummary = summaryMatch ? summaryMatch[1].trim() : responseText;
          const extractedKeywords = keywordsMatch 
            ? keywordsMatch[1].trim().split(',').map(k => k.trim()).filter(k => k)
            : [];
          
          chunkSummaries.push({
            chunkIndex: i + 1,
            summary: extractedSummary,
            keywords: extractedKeywords,
            wordCount: chunks[i].split(' ').length
          });
        } catch (chunkError) {
          console.warn(`Failed to summarize chunk ${i + 1}:`, chunkError.message);
          // Continue with other chunks
        }
      }
      
      // Step 3: Create table format using keywords as headers
      const allKeywords = chunkSummaries.flatMap(chunk => chunk.keywords);
      const uniqueKeywords = [...new Set(allKeywords)];
      
      // Group summaries by keywords for table format
      const keywordTable = {};
      uniqueKeywords.forEach(keyword => {
        keywordTable[keyword] = chunkSummaries
          .filter(chunk => chunk.keywords.includes(keyword))
          .map(chunk => `Part ${chunk.chunkIndex}: ${chunk.summary}`)
          .join('\n');
      });
      
      // Step 4: Combine all chunk summaries for comprehensive analysis
      const combinedSummaryText = chunkSummaries
        .map(chunk => `Part ${chunk.chunkIndex} (Keywords: ${chunk.keywords.join(', ')}): ${chunk.summary}`)
        .join('\n\n');
      
      console.log(`Generated ${chunkSummaries.length} chunk summaries with ${uniqueKeywords.length} unique keywords`);
      
      // Step 5: Generate final structured summary from combined summaries
      const finalSummary = await episodeSummary.generateEpisodeSummary(
        combinedSummaryText, 
        episodeInfo, 
        {
          ...options,
          isFromChunks: true,
          chunkCount: chunks.length,
          customPrompt: `Based on these episode part summaries with keywords, create a comprehensive structured analysis:`
        }
      );
      
      // Add metadata about chunking process and keyword table
      return {
        ...finalSummary,
        keywordTable: keywordTable,
        chunkDetails: chunkSummaries.map(chunk => ({
          chunkIndex: chunk.chunkIndex,
          keywords: chunk.keywords,
          summary: chunk.summary,
          wordCount: chunk.wordCount
        })),
        processingInfo: {
          method: 'Chunked AI Summarization with Keywords',
          chunkCount: chunks.length,
          chunkSummaries: chunkSummaries.length,
          uniqueKeywords: uniqueKeywords.length,
          keywordList: uniqueKeywords,
          originalWordCount: transcript.split(' ').length,
          compressionRatio: `${Math.round((transcript.split(' ').length / combinedSummaryText.split(' ').length) * 10) / 10}:1`
        }
      };
      
    } catch (error) {
      console.error('Chunked episode summary failed:', error.message);
      // Fallback to basic summarization
      return await episodeSummary.generateEpisodeSummary(transcript.slice(0, 4000), episodeInfo, options);
    }
  }

  /**
   * Split transcript into word-based chunks
   * @param {string} transcript - Full transcript text
   * @param {number} wordsPerChunk - Target words per chunk (default: 300)
   * @returns {Array<string>} Array of transcript chunks
   */
  splitTranscriptIntoChunks(transcript, wordsPerChunk = 300) {
    const words = transcript.split(' ');
    const chunks = [];
    
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      const chunk = words.slice(i, i + wordsPerChunk).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  /**
   * Generate quick episode overview (essential sections only)
   * @param {string} transcript - Episode transcript  
   * @param {Object} episodeInfo - Episode metadata
   * @returns {Promise<Object>} Quick overview
   */
  async generateQuickOverview(transcript, episodeInfo = {}) {
    return await episodeSummary.generateQuickOverview(transcript, episodeInfo);
  }

  /**
   * Generate mind map structure from transcript
   * @param {string} transcript - Episode transcript
   * @param {Object} episodeInfo - Episode metadata (title, description, etc.)
   * @returns {Promise<Object>} Structured mind map data
   */
  async generateMindMap(transcript, episodeInfo = {}) {
    try {
      // Input validation
      if (!promptBuilder.isValidTranscript(transcript)) {
        throw new Error('Transcript is empty or invalid');
      }

      // Use AI if configured, otherwise fallback
      if (!statusManager.isAiConfigured()) {
        return this.generateFallbackMindMap(transcript, episodeInfo);
      }

      // Generate structured mind map using AI
      const mindMapPrompt = this.buildMindMapPrompt(transcript, episodeInfo);
      const aiResponse = await summaryGenerator.generateSummary(transcript, {
        type: 'mindmap',
        customPrompt: mindMapPrompt,
        maxTokens: 2000
      });

      // Parse AI response into structured mind map format
      return this.parseAIMindMapResponse(aiResponse.summary, episodeInfo);

    } catch (error) {
      console.error('Mind map generation failed:', error.message);
      return this.generateFallbackMindMap(transcript, episodeInfo);
    }
  }

  /**
   * Build specialized prompt for mind map generation
   * @param {string} transcript - Source transcript
   * @param {Object} episodeInfo - Episode metadata
   * @returns {string} Formatted prompt
   */
  buildMindMapPrompt(transcript, episodeInfo) {
    return `Generate a structured mind map analysis of this podcast episode transcript. 

Episode Title: ${episodeInfo.title || 'Untitled Episode'}
Episode Description: ${episodeInfo.description || 'No description'}

Please analyze the transcript and provide:

1. OVERVIEW (2-3 sentences describing the main topic and key focus)
2. KEY TOPICS (4-5 main themes or subjects discussed)  
3. KEY INSIGHTS (4-5 actionable takeaways or important lessons)
4. NOTABLE QUOTES (3-4 memorable or impactful quotes from the episode)
5. ACTION ITEMS (4-5 concrete steps listeners can implement)

Format your response as JSON with this structure:
{
  "overview": "Brief episode summary...",
  "sections": {
    "overview": {"items": ["Topic: ...", "Duration: ...", "Focus: ..."]},
    "topics": {"items": ["📚 Topic 1", "💼 Topic 2", "🎯 Topic 3", "🔧 Topic 4"]},
    "insights": {"items": ["Insight 1", "Insight 2", "Insight 3", "Insight 4"]},
    "quotes": {"items": ["\\"Quote 1\\"", "\\"Quote 2\\"", "\\"Quote 3\\""]},
    "actions": {"items": ["Action 1", "Action 2", "Action 3", "Action 4"]}
  }
}

Transcript:
${transcript.slice(0, 8000)}`;
  }

  /**
   * Parse AI response into mind map structure
   * @param {string} aiResponse - Raw AI response
   * @param {Object} episodeInfo - Episode metadata
   * @returns {Object} Structured mind map data
   */
  parseAIMindMapResponse(aiResponse, episodeInfo) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiResponse);
      
      return {
        title: episodeInfo.title || 'Podcast Episode',
        overview: parsed.overview || 'AI-generated summary of the episode content.',
        sections: {
          overview: {
            title: '📋 Episode Overview',
            color: '#3b82f6',
            items: parsed.sections?.overview?.items || ['AI-generated overview']
          },
          topics: {
            title: '🎯 Key Topics',
            color: '#10b981',
            items: parsed.sections?.topics?.items || ['Main discussion topics']
          },
          insights: {
            title: '💡 Key Insights',
            color: '#f59e0b',
            items: parsed.sections?.insights?.items || ['Important takeaways']
          },
          quotes: {
            title: '💬 Notable Quotes',
            color: '#8b5cf6',
            items: parsed.sections?.quotes?.items || ['Memorable quotes from the episode']
          },
          actions: {
            title: '✅ Action Items',
            color: '#ef4444',
            items: parsed.sections?.actions?.items || ['Steps to implement']
          }
        }
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return this.generateFallbackMindMap('', episodeInfo);
    }
  }

  /**
   * Generate fallback mind map when AI is unavailable
   * @param {string} transcript - Source transcript  
   * @param {Object} episodeInfo - Episode metadata
   * @returns {Object} Basic mind map structure
   */
  generateFallbackMindMap(transcript, episodeInfo) {
    const basicAnalysis = fallbackHandler.generateBasicSummary(transcript, { type: 'detailed' });
    
    return {
      title: episodeInfo.title || 'Podcast Episode',
      overview: 'Basic text analysis of the episode content (AI unavailable).',
      sections: {
        overview: {
          title: '📋 Episode Overview',
          color: '#3b82f6',
          items: [
            `Title: ${episodeInfo.title || 'Unknown'}`,
            `Length: ${Math.floor(transcript.length / 200)} min estimated`,
            'Content: Text-based analysis',
            'Processing: Fallback mode'
          ]
        },
        topics: {
          title: '🎯 Key Topics',
          color: '#10b981',
          items: basicAnalysis.keyPoints?.slice(0, 4) || [
            'Main discussion points',
            'Episode themes',
            'Subject matter',
            'Core concepts'
          ]
        },
        insights: {
          title: '💡 Key Insights',
          color: '#f59e0b',
          items: [
            'Review the full transcript for insights',
            'Listen to identify key takeaways',
            'Focus on actionable content',
            'Note important concepts'
          ]
        },
        quotes: {
          title: '💬 Notable Quotes',
          color: '#8b5cf6',
          items: [
            'Manual review needed for quotes',
            'Check transcript for memorable statements',
            'Identify impactful discussions'
          ]
        },
        actions: {
          title: '✅ Action Items',
          color: '#ef4444',
          items: [
            'Review episode for actionable advice',
            'Take notes during listening',
            'Identify practical applications',
            'Plan implementation steps'
          ]
        }
      }
    };
  }

  /**
   * Generate multiple summary types in parallel
   * @param {string} transcript - Source transcript
   * @param {Array<string>} types - Summary types to generate
   * @returns {Promise<Object>} Multiple summary results
   */
  async generateMultipleSummaries(transcript, types = ['brief', 'detailed']) {
    return await summaryGenerator.generateMultipleSummaries(transcript, types);
  }

  /**
   * Get available models information
   * @returns {Object} Available models with their details
   */
  getAvailableModels() {
    return aiConfig.getAvailableModels();
  }

  /**
   * Validate AI service configuration
   * @returns {boolean} Configuration status
   */
  isAiConfigured() {
    return statusManager.isAiConfigured();
  }

  /**
   * Get comprehensive AI provider status
   * @returns {Object} Provider status information
   */
  getAIProviderStatus() {
    return statusManager.getAIProviderStatus();
  }

  /**
   * Test AI service connectivity
   * @returns {Promise<Object>} Connectivity test results
   */
  async testConnectivity() {
    return await statusManager.testConnectivity();
  }

  /**
   * Get service capabilities
   * @returns {Object} Service capabilities and limitations
   */
  getCapabilities() {
    return statusManager.getCapabilities();
  }

  /**
   * Generate comprehensive status report
   * @returns {Promise<Object>} Detailed status report
   */
  async generateStatusReport() {
    return await statusManager.generateStatusReport();
  }

  /**
   * Estimate processing requirements for a transcript
   * @param {string} transcript - Source transcript
   * @param {Object} options - Processing options
   * @returns {Object} Processing estimates
   */
  estimateProcessing(transcript, options = {}) {
    return summaryGenerator.estimateProcessing(transcript, options);
  }

  /**
   * Determine if we should use fallback based on error type
   * @param {Error} error - The error that occurred
   * @returns {boolean} Whether to use fallback
   */
  shouldUseFallback(error) {
    const errorMessage = error.message.toLowerCase();
    
    // Use fallback for these types of errors
    const fallbackTriggers = [
      'api key',
      'quota',
      'rate limit', 
      'safety',
      'network',
      'connection',
      'timeout'
    ];
    
    return fallbackTriggers.some(trigger => errorMessage.includes(trigger));
  }

  /**
   * Get module status for debugging
   * @returns {Object} Status of all modules
   */
  getModuleStatus() {
    return {
      config: {
        available: true,
        configured: aiConfig.isGeminiConfigured(),
        defaultModel: aiConfig.getDefaultModel()
      },
      modelManager: {
        available: true,
        models: modelManager.getModelStatus()
      },
      promptBuilder: {
        available: true,
        maxTranscriptLength: 8000
      },
      summaryGenerator: {
        status: summaryGenerator.getStatus()
      },
      episodeSummary: {
        capabilities: episodeSummary.getCapabilities()
      },
      fallbackHandler: {
        status: fallbackHandler.getStatus()
      },
      statusManager: {
        available: true,
        healthStatus: statusManager.getHealthStatus()
      }
    };
  }
}

module.exports = new SummaryService();
