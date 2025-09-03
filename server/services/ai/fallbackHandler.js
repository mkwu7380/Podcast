/**
 * Fallback Handler Module
 * Provides basic text processing without AI when API services are unavailable
 */

class FallbackHandler {
  constructor() {
    this.minSentenceLength = 10; // Minimum characters for a valid sentence
    this.summaryRatio = 0.1; // Extract 10% of sentences for summary
  }

  /**
   * Generate basic summary using text extraction algorithms
   * @param {string} transcript - Original transcript text
   * @param {Object} options - Summary options (type, maxTokens, etc.)
   * @returns {Object} Basic summary result
   */
  generateBasicSummary(transcript, options = {}) {
    if (!this.isValidTranscript(transcript)) {
      throw new Error('Invalid transcript provided for basic summary');
    }

    const sentences = this.extractSentences(transcript);
    const wordCount = transcript.split(' ').length;
    
    // Determine summary length based on transcript size
    const summaryLength = this.calculateSummaryLength(sentences.length);
    
    // Extract representative sentences
    const summarySentences = this.extractRepresentativeSentences(sentences, summaryLength);
    const basicSummary = summarySentences.join('. ') + '.';

    return {
      summary: basicSummary,
      type: 'basic',
      wordCount: basicSummary.split(' ').length,
      originalWordCount: wordCount,
      model: 'basic-extraction',
      generatedAt: new Date().toISOString(),
      note: 'This is a basic summary. For AI-powered summaries, configure a Gemini API key.',
      metadata: {
        originalSentences: sentences.length,
        summarySentences: summarySentences.length,
        compressionRatio: (summarySentences.length / sentences.length).toFixed(2)
      }
    };
  }

  /**
   * Extract sentences from transcript
   * @param {string} transcript - Original transcript
   * @returns {Array<string>} Array of sentences
   */
  extractSentences(transcript) {
    return transcript
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length >= this.minSentenceLength);
  }

  /**
   * Calculate appropriate summary length
   * @param {number} totalSentences - Total number of sentences
   * @returns {number} Target number of sentences for summary
   */
  calculateSummaryLength(totalSentences) {
    const minSummary = 3; // At least 3 sentences
    const maxSummary = 8; // At most 8 sentences
    const calculated = Math.floor(totalSentences * this.summaryRatio);
    
    return Math.max(minSummary, Math.min(maxSummary, calculated));
  }

  /**
   * Extract representative sentences using position-based selection
   * @param {Array<string>} sentences - All sentences
   * @param {number} targetLength - Target number of sentences
   * @returns {Array<string>} Selected representative sentences
   */
  extractRepresentativeSentences(sentences, targetLength) {
    if (sentences.length <= targetLength) {
      return sentences;
    }

    // Use balanced selection: beginning, middle, and end
    const firstPortion = Math.ceil(targetLength * 0.4); // 40% from beginning
    const lastPortion = Math.floor(targetLength * 0.3); // 30% from end
    const middlePortion = targetLength - firstPortion - lastPortion; // 30% from middle

    const result = [];
    
    // Get sentences from beginning
    result.push(...sentences.slice(0, firstPortion));
    
    // Get sentences from middle
    if (middlePortion > 0) {
      const middleStart = Math.floor((sentences.length - middlePortion) / 2);
      result.push(...sentences.slice(middleStart, middleStart + middlePortion));
    }
    
    // Get sentences from end
    if (lastPortion > 0) {
      result.push(...sentences.slice(-lastPortion));
    }

    return result;
  }

  /**
   * Generate keyword-based summary (alternative approach)
   * @param {string} transcript - Original transcript
   * @returns {Object} Keyword-based summary
   */
  generateKeywordSummary(transcript) {
    const words = this.extractKeywords(transcript);
    const sentences = this.extractSentences(transcript);
    
    // Find sentences containing the most keywords
    const scoredSentences = sentences.map(sentence => ({
      text: sentence,
      score: this.scoreSentence(sentence, words)
    }));

    // Sort by score and take top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.text);

    return {
      summary: topSentences.join('. ') + '.',
      type: 'keyword-based',
      keywords: words.slice(0, 10), // Top 10 keywords
      wordCount: topSentences.join(' ').split(' ').length,
      model: 'keyword-extraction',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Extract keywords from transcript
   * @param {string} transcript - Original transcript
   * @returns {Array<string>} Top keywords
   */
  extractKeywords(transcript) {
    // Simple keyword extraction (can be enhanced)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
    
    const words = transcript.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .map(([word]) => word);
  }

  /**
   * Score sentence based on keyword presence
   * @param {string} sentence - Sentence to score
   * @param {Array<string>} keywords - Important keywords
   * @returns {number} Sentence score
   */
  scoreSentence(sentence, keywords) {
    const sentenceWords = sentence.toLowerCase().split(/\W+/);
    return keywords.reduce((score, keyword) => {
      return sentenceWords.includes(keyword) ? score + 1 : score;
    }, 0);
  }

  /**
   * Validate transcript for processing
   * @param {string} transcript - Transcript to validate
   * @returns {boolean} Whether transcript is valid
   */
  isValidTranscript(transcript) {
    return transcript && 
           typeof transcript === 'string' && 
           transcript.trim().length > 0;
  }

  /**
   * Get fallback method status and capabilities
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      available: true,
      methods: ['basic-extraction', 'keyword-based'],
      capabilities: {
        minSentenceLength: this.minSentenceLength,
        summaryRatio: this.summaryRatio,
        supportsKeywords: true,
        requiresAPI: false
      }
    };
  }
}

module.exports = new FallbackHandler();
