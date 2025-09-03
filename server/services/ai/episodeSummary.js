/**
 * Episode Summary Module
 * Specialized summarization for podcast episodes with structured output
 */

const summaryGenerator = require('./summaryGenerator');
const promptBuilder = require('./promptBuilder');

class EpisodeSummary {
  constructor() {
    // Define the sections we extract for episode summaries
    this.episodeSections = {
      overview: {
        description: 'Provide a 2-3 sentence overview of this podcast episode',
        maxTokens: 150,
        priority: 'high'
      },
      keyPoints: {
        description: 'List the 5-7 most important points or insights discussed',
        maxTokens: 300,
        priority: 'high'
      },
      topics: {
        description: 'Identify the main topics and themes covered',
        maxTokens: 200,
        priority: 'medium'
      },
      quotes: {
        description: 'Extract 2-3 most impactful or memorable quotes',
        maxTokens: 250,
        priority: 'medium'
      },
      actionItems: {
        description: 'Identify any actionable advice or recommendations mentioned',
        maxTokens: 200,
        priority: 'low'
      }
    };
  }

  /**
   * Generate comprehensive podcast episode summary with structured sections
   * @param {string} transcript - Episode transcript
   * @param {Object} episodeInfo - Episode metadata (title, pubDate, duration, etc.)
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Structured episode summary
   */
  async generateEpisodeSummary(transcript, episodeInfo = {}, options = {}) {
    try {
      this.validateEpisodeInput(transcript, episodeInfo);

      const sectionsToProcess = options.sections || Object.keys(this.episodeSections);
      const summaries = {};
      const errors = {};
      const processingStats = {
        attempted: sectionsToProcess.length,
        successful: 0,
        failed: 0,
        startTime: new Date()
      };

      // Process each section
      for (const section of sectionsToProcess) {
        try {
          const sectionConfig = this.episodeSections[section];
          if (!sectionConfig) {
            throw new Error(`Unknown section: ${section}`);
          }

          const sectionSummary = await this.generateSectionSummary(
            transcript, 
            section, 
            sectionConfig,
            options
          );
          
          summaries[section] = sectionSummary;
          processingStats.successful++;

        } catch (error) {
          console.warn(`Failed to generate ${section} summary:`, error.message);
          summaries[section] = this.getDefaultSectionContent(section);
          errors[section] = error.message;
          processingStats.failed++;
        }
      }

      return this.formatEpisodeResult(
        summaries, 
        episodeInfo, 
        transcript, 
        processingStats, 
        errors
      );

    } catch (error) {
      throw new Error(`Episode summary generation failed: ${error.message}`);
    }
  }

  /**
   * Generate summary for a specific section
   * @param {string} transcript - Full transcript
   * @param {string} section - Section name
   * @param {Object} sectionConfig - Section configuration
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Section summary
   */
  async generateSectionSummary(transcript, section, sectionConfig, options = {}) {
    const prompt = promptBuilder.buildEpisodePrompt(section, transcript);
    
    const sectionOptions = {
      type: 'focused',
      customPrompt: prompt,
      maxTokens: sectionConfig.maxTokens,
      model: options.model,
      temperature: options.temperature || 0.3
    };

    const result = await summaryGenerator.generateSummary(transcript, sectionOptions);
    return result.summary;
  }

  /**
   * Generate episode summary with priority-based processing
   * Processes high-priority sections first, continues with others based on time/token budget
   * @param {string} transcript - Episode transcript
   * @param {Object} episodeInfo - Episode metadata
   * @param {Object} budget - Processing budget (maxTime, maxTokens)
   * @returns {Promise<Object>} Priority-based episode summary
   */
  async generatePrioritizedSummary(transcript, episodeInfo, budget = {}) {
    const maxTime = budget.maxTime || 30000; // 30 seconds max
    const startTime = Date.now();
    
    // Sort sections by priority
    const prioritizedSections = this.getSectionsByPriority();
    const results = {};
    const stats = { processed: 0, skipped: 0, errors: 0 };

    for (const { section, config } of prioritizedSections) {
      // Check time budget
      if (Date.now() - startTime > maxTime) {
        console.warn(`Time budget exceeded, skipping remaining sections`);
        stats.skipped++;
        continue;
      }

      try {
        results[section] = await this.generateSectionSummary(transcript, section, config);
        stats.processed++;
      } catch (error) {
        results[section] = this.getDefaultSectionContent(section);
        stats.errors++;
      }
    }

    return {
      episode: this.formatEpisodeMetadata(episodeInfo),
      summary: results,
      processingStats: {
        ...stats,
        totalSections: prioritizedSections.length,
        processingTime: Date.now() - startTime,
        budgetExceeded: stats.skipped > 0
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate quick episode overview (essential sections only)
   * @param {string} transcript - Episode transcript
   * @param {Object} episodeInfo - Episode metadata
   * @returns {Promise<Object>} Quick overview summary
   */
  async generateQuickOverview(transcript, episodeInfo = {}) {
    const essentialSections = ['overview', 'keyPoints'];
    
    return await this.generateEpisodeSummary(
      transcript, 
      episodeInfo, 
      { sections: essentialSections }
    );
  }

  /**
   * Get sections ordered by priority
   * @returns {Array<Object>} Sections with their configurations, ordered by priority
   */
  getSectionsByPriority() {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    
    return Object.entries(this.episodeSections)
      .map(([section, config]) => ({ section, config }))
      .sort((a, b) => priorityOrder[a.config.priority] - priorityOrder[b.config.priority]);
  }

  /**
   * Get default content when section processing fails
   * @param {string} section - Section name
   * @returns {string} Default content
   */
  getDefaultSectionContent(section) {
    const defaults = {
      overview: 'Episode overview could not be generated.',
      keyPoints: 'Key points extraction failed.',
      topics: 'Topics identification unavailable.',
      quotes: 'Notable quotes could not be extracted.',
      actionItems: 'Action items not identified.'
    };
    
    return defaults[section] || `${section} content unavailable.`;
  }

  /**
   * Validate episode input data
   * @param {string} transcript - Transcript to validate
   * @param {Object} episodeInfo - Episode info to validate
   */
  validateEpisodeInput(transcript, episodeInfo) {
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      throw new Error('Valid transcript is required for episode summary');
    }

    if (episodeInfo && typeof episodeInfo !== 'object') {
      throw new Error('Episode info must be an object');
    }
  }

  /**
   * Format episode metadata
   * @param {Object} episodeInfo - Raw episode information
   * @returns {Object} Formatted episode metadata
   */
  formatEpisodeMetadata(episodeInfo) {
    return {
      title: episodeInfo.title || 'Unknown Episode',
      publishDate: episodeInfo.pubDate || null,
      duration: episodeInfo.duration || null,
      description: episodeInfo.description || null,
      podcastName: episodeInfo.podcastName || null,
      episodeNumber: episodeInfo.episodeNumber || null,
      seasonNumber: episodeInfo.seasonNumber || null
    };
  }

  /**
   * Format final episode result
   * @param {Object} summaries - Generated summaries
   * @param {Object} episodeInfo - Episode metadata
   * @param {string} transcript - Original transcript
   * @param {Object} stats - Processing statistics
   * @param {Object} errors - Any errors encountered
   * @returns {Object} Formatted episode summary result
   */
  formatEpisodeResult(summaries, episodeInfo, transcript, stats, errors) {
    return {
      episode: this.formatEpisodeMetadata(episodeInfo),
      summary: summaries,
      transcriptLength: transcript.length,
      transcriptWordCount: transcript.split(' ').length,
      processingStats: {
        ...stats,
        processingTime: Date.now() - stats.startTime.getTime(),
        successRate: (stats.successful / stats.attempted * 100).toFixed(1) + '%'
      },
      errors: Object.keys(errors).length > 0 ? errors : null,
      generatedAt: new Date().toISOString(),
      sectionsAvailable: Object.keys(summaries),
      quality: this.assessSummaryQuality(summaries, errors)
    };
  }

  /**
   * Assess the quality of generated summaries
   * @param {Object} summaries - Generated summaries
   * @param {Object} errors - Processing errors
   * @returns {Object} Quality assessment
   */
  assessSummaryQuality(summaries, errors) {
    const totalSections = Object.keys(this.episodeSections).length;
    const successfulSections = Object.keys(summaries).filter(
      section => !section.includes('could not be generated')
    ).length;
    
    const errorCount = Object.keys(errors).length;
    const qualityScore = (successfulSections / totalSections * 100);
    
    return {
      score: Math.round(qualityScore),
      level: qualityScore >= 80 ? 'high' : qualityScore >= 60 ? 'medium' : 'low',
      completeness: `${successfulSections}/${totalSections} sections`,
      hasErrors: errorCount > 0,
      errorCount
    };
  }

  /**
   * Get episode summary capabilities and status
   * @returns {Object} Capabilities information
   */
  getCapabilities() {
    return {
      availableSections: Object.keys(this.episodeSections),
      sectionDetails: this.episodeSections,
      supportsPrioritization: true,
      supportsQuickOverview: true,
      supportsBudgetLimits: true,
      maxTranscriptLength: 100000,
      qualityAssessment: true
    };
  }
}

module.exports = new EpisodeSummary();
