const summaryService = require('../services/summaryService');
const summaryServiceNew = require('../services/summaryServiceNew');
const freeSummaryService = require('../services/freeSummaryService');
const transcriptionService = require('../services/transcriptionService');
const episodeRerankingService = require('../services/episodeRerankingService');
const { fetchEpisodes } = require('../../services/podcastService');
const { createResponse, createErrorResponse } = require('../utils/responseHelper');

/**
 * Controller for handling podcast and episode summarization
 */
class SummaryController {
  /**
   * Generate summary from uploaded audio file
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async summarizeAudio(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json(createErrorResponse('No audio file provided'));
      }

      // Use free service if no API key is configured
      const useFreeSummary = !process.env.GEMINI_API_KEY;
      const summaryType = req.body.type || 'comprehensive';
      const episodeInfo = {
        title: req.body.title,
        pubDate: req.body.pubDate,
        duration: req.body.duration
      };

      // First transcribe the audio
      const transcript = await transcriptionService.transcribeAudio(req.file.path);
      
      if (!transcript) {
        return res.status(500).json(createErrorResponse('Failed to transcribe audio'));
      }

      // Then generate summary
      let summaryResult;
      if (req.body.episodeSummary === 'true') {
        summaryResult = useFreeSummary 
          ? await freeSummaryService.generateEpisodeSummary(transcript, episodeInfo)
          : await summaryService.generateEpisodeSummary(transcript, episodeInfo);
      } else {
        summaryResult = useFreeSummary
          ? await freeSummaryService.generateSummary(transcript, { type: summaryType })
          : await summaryService.generateSummary(transcript, { type: summaryType });
      }

      // Clean up uploaded file
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError.message);
      }

      res.json(createResponse({
        data: {
          summary: summaryResult,
          transcript: transcript,
          processingTime: new Date().toISOString(),
          audioFile: {
            originalName: req.file.originalname,
            size: req.file.size
          }
        }
      }));

    } catch (error) {
      console.error('Audio summarization error:', error);
      res.status(500).json(createErrorResponse(error.message || 'Failed to summarize audio'));
    }
  }

  /**
   * Generate summary from provided transcript text
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async summarizeTranscript(req, res) {
    try {
      const { transcript: transcriptText, type = 'comprehensive', episodeInfo } = req.body;

      if (!transcriptText || transcriptText.trim().length === 0) {
        return res.status(400).json(createErrorResponse('Transcript text is required'));
      }

      // Use free service if no API key is configured
      const useFreeSummary = !process.env.GEMINI_API_KEY;

      let summaryResult;
      if (episodeInfo) {
        summaryResult = useFreeSummary
          ? await freeSummaryService.generateEpisodeSummary(transcriptText, episodeInfo)
          : await summaryService.generateEpisodeSummary(transcriptText, episodeInfo);
      } else {
        summaryResult = useFreeSummary
          ? await freeSummaryService.generateSummary(transcriptText, { type })
          : await summaryService.generateSummary(transcriptText, { type });
      }

      res.json(createResponse({
        data: {
          summary: summaryResult,
          transcript: transcriptText,
          processingTime: new Date().toISOString(),
          inputLength: transcriptText.length
        }
      }));

    } catch (error) {
      console.error('Transcript summarization error:', error);
      res.status(500).json(createErrorResponse(error.message || 'Failed to summarize transcript'));
    }
  }

  /**
   * Summarize podcast episode from URL
   * @param {Request} req - Express request object  
   * @param {Response} res - Express response object
   */
  async summarizeEpisodeFromUrl(req, res) {
    try {
      const { audioUrl, episodeInfo, summaryType = 'comprehensive' } = req.body;

      if (!audioUrl) {
        return res.status(400).json(createErrorResponse('Audio URL is required'));
      }

      // Use free service if no API key is configured
      const useFreeSummary = !process.env.GEMINI_API_KEY;

      // Download and transcribe audio from URL
      const axios = require('axios');
      const fs = require('fs');
      const path = require('path');
      
      // Create temporary file for downloaded audio
      const tempDir = path.join(__dirname, '../../uploads');
      const tempFile = path.join(tempDir, `temp_${Date.now()}.mp3`);

      try {
        // Validate audio URL first
        if (!audioUrl || !audioUrl.startsWith('http')) {
          throw new Error('Invalid or missing audio URL');
        }

        // Check for known problematic domains that block programmatic access
        const url = new URL(audioUrl);
        const problematicDomains = ['cdn.lizhi.fm', 'podcast.rthk.hk'];
        if (problematicDomains.some(domain => url.hostname.includes(domain))) {
          return res.status(400).json(createErrorResponse(`This podcast provider (${url.hostname}) blocks automated audio processing. Please try uploading the audio file directly or use the real-time transcription feature.`));
        }

        console.log(`Attempting to download audio from: ${audioUrl}`);

        // Download audio file with proper headers to avoid 403 errors
        const response = await axios({
          method: 'get',
          url: audioUrl,
          responseType: 'stream',
          timeout: 120000, // 2 minutes for download
          maxRedirects: 30, // High limit for complex podcast tracking chains
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'audio/mpeg, audio/mp4, audio/wav, audio/*, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        });

        // Check if the response is successful
        if (response.status !== 200) {
          throw new Error(`Failed to download audio: HTTP ${response.status}`);
        }

        console.log(`Audio download successful: ${response.headers['content-type']}, ${response.headers['content-length']} bytes`);

        // Save to temporary file
        const writer = fs.createWriteStream(tempFile);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Transcribe the downloaded audio
        const transcript = await transcriptionService.transcribeAudio(tempFile);
        
        if (!transcript) {
          throw new Error('Failed to transcribe downloaded audio');
        }

        // Generate summary
        let summaryResult;
        if (episodeInfo) {
          summaryResult = useFreeSummary
            ? await freeSummaryService.generateEpisodeSummary(transcript, episodeInfo)
            : await summaryService.generateEpisodeSummary(transcript, episodeInfo);
        } else {
          summaryResult = useFreeSummary
            ? await freeSummaryService.generateSummary(transcript, { type: summaryType })
            : await summaryService.generateSummary(transcript, { type: summaryType });
        }

        // Clean up temporary file
        try {
          fs.unlinkSync(tempFile);
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp file:', cleanupError.message);
        }

        res.json(createResponse({
          data: {
            summary: summaryResult,
            transcript: transcript,
            processingTime: new Date().toISOString(),
            episodeInfo: {
              audioUrl,
              title: episodeInfo?.title,
              pubDate: episodeInfo?.pubDate,
              duration: episodeInfo?.duration
            },
            downloadInfo: {
              contentType: response.headers['content-type'],
              contentLength: response.headers['content-length']
            }
          }
        }));

      } catch (downloadError) {
        // Clean up temp file if it exists
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp file after error:', cleanupError.message);
        }
        throw downloadError;
      }

    } catch (error) {
      console.error('Episode URL summarization error:', {
        message: error.message,
        audioUrl: req.body.audioUrl,
        status: error.response?.status,
        statusText: error.response?.statusText,
        stack: error.stack
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to summarize episode from URL';
      if (error.response?.status === 404) {
        errorMessage = `Audio file not found at URL: ${req.body.audioUrl}. The episode may no longer be available.`;
      } else if (error.response?.status === 403) {
        errorMessage = `Access denied to audio file. The podcast may have restricted access.`;
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = `Could not connect to audio server. Please check the URL.`;
      } else if (error.message.includes('timeout')) {
        errorMessage = `Download timeout. The audio file may be too large or the server is slow.`;
      } else if (error.message.includes('Maximum number of redirects exceeded') || error.code === 'ERR_FR_TOO_MANY_REDIRECTS') {
        errorMessage = `Too many redirects in podcast URL. This episode uses complex tracking that cannot be processed automatically. Please try a different episode or use the real-time transcription feature.`;
      }
      
      res.status(500).json(createErrorResponse(errorMessage));
    }
  }

  /**
   * Get AI service status and configuration
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getServiceStatus(req, res) {
    try {
      const isConfigured = summaryService.isAiConfigured();
      
      res.json(createResponse({
        data: {
          service: 'AI Summary Service',
          status: 'operational',
          aiProvider: summaryService.getAIProviderStatus(),
          supportedSummaryTypes: [
            'brief',
            'comprehensive', 
            'detailed',
            'bullet-points'
          ],
          capabilities: {
            audioTranscription: true,
            textSummarization: true,
            episodeSummarization: true,
            structuredSummaries: true
          },
          timestamp: new Date().toISOString()
        }
      }));

    } catch (error) {
      console.error('Service status error:', error);
      res.status(500).json(createErrorResponse('Failed to get service status'));
    }
  }

  /**
   * Generate mind map from transcript
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async generateMindMap(req, res) {
    try {
      const { transcript, summaryData, episodeInfo = {} } = req.body;

      // If summaryData is provided, convert it to mind map format directly
      if (summaryData) {
        const mindMapData = SummaryController.convertSummaryToMindMap(summaryData, episodeInfo);
        
        return res.json(createResponse({
          data: {
            mindMap: mindMapData,
            metadata: {
              source: 'existing-summary',
              processingTime: new Date().toISOString(),
              aiConfigured: summaryServiceNew.isAiConfigured()
            }
          }
        }, 'Mind map generated from existing summary'));
      }

      // Fallback to transcript-based generation
      if (!transcript || !transcript.trim()) {
        return res.status(400).json(createErrorResponse('Either transcript or summaryData is required'));
      }

      // Use the new modular summary service for mind map generation
      const mindMapData = await summaryServiceNew.generateMindMap(transcript, episodeInfo);

      res.json(createResponse({
        data: {
          mindMap: mindMapData,
          metadata: {
            transcriptLength: transcript.length,
            processingTime: new Date().toISOString(),
            aiConfigured: summaryServiceNew.isAiConfigured()
          }
        }
      }, 'Mind map generated successfully'));

    } catch (error) {
      console.error('Mind map generation error:', error);
      res.status(500).json(createErrorResponse('Failed to generate mind map', {
        error: error.message
      }));
    }
  }

  /**
   * Batch summarize episodes with intelligent prioritization
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async batchSummarizeEpisodes(req, res) {
    try {
      const {
        feedUrl,
        maxEpisodes = 5,
        summaryType = 'comprehensive',
        rankingStrategy = 'hybrid',
        query = '',
        userPreferences = {},
        processHighPriorityOnly = false
      } = req.body;

      if (!feedUrl) {
        return res.status(400).json(createErrorResponse('Feed URL is required'));
      }

      console.log(`🔄 Starting batch summarization with ${rankingStrategy} prioritization`);

      // Step 1: Get all episodes from the feed
      const allEpisodes = await fetchEpisodes(feedUrl, 0);
      
      if (!allEpisodes || allEpisodes.length === 0) {
        return res.json(createResponse({
          summaries: [],
          message: 'No episodes found in podcast feed',
          processingStats: {
            totalEpisodes: 0,
            processed: 0,
            skipped: 0
          }
        }));
      }

      // Step 2: Apply intelligent reranking for processing priority
      const rankedEpisodes = await episodeRerankingService.rerankEpisodes(allEpisodes, {
        strategy: rankingStrategy,
        query,
        userPreferences
      });

      console.log(`📊 Episodes reranked: ${rankedEpisodes.length} total`);

      // Step 3: Filter episodes based on priority if requested
      let episodesToProcess = rankedEpisodes.slice(0, maxEpisodes);
      
      if (processHighPriorityOnly) {
        episodesToProcess = rankedEpisodes.filter(
          ep => ep._processingPriority?.priority === 'high'
        ).slice(0, maxEpisodes);
      }

      // Step 4: Process episodes in priority order
      const summaryResults = [];
      const processingErrors = [];
      const useFreeSummary = !process.env.GEMINI_API_KEY;

      console.log(`🎯 Processing ${episodesToProcess.length} episodes for summarization`);

      for (let i = 0; i < episodesToProcess.length; i++) {
        const episode = episodesToProcess[i];
        const priority = episode._processingPriority?.priority || 'medium';
        
        console.log(`📝 Processing episode ${i + 1}/${episodesToProcess.length} (${priority} priority): ${episode.title?.substring(0, 50)}...`);

        try {
          // Check if episode has valid audio URL
          if (!episode.enclosure?.url) {
            console.warn(`⚠️ Skipping episode without audio URL: ${episode.title}`);
            processingErrors.push({
              episode: episode.title,
              error: 'No audio URL available',
              priority: priority
            });
            continue;
          }

          // Process this episode
          const summaryResult = await this.processSingleEpisodeForBatch(
            episode,
            summaryType,
            useFreeSummary
          );

          summaryResults.push({
            episode: {
              title: episode.title,
              pubDate: episode.pubDate,
              duration: episode.itunes?.duration,
              audioUrl: episode.enclosure.url
            },
            summary: summaryResult,
            processingPriority: episode._processingPriority,
            scores: episode._scores,
            processedAt: new Date().toISOString()
          });

        } catch (error) {
          console.error(`❌ Failed to process episode: ${episode.title}`, error.message);
          processingErrors.push({
            episode: episode.title,
            error: error.message,
            priority: priority
          });
        }
      }

      // Step 5: Organize results by priority
      const resultsByPriority = {
        high: summaryResults.filter(r => r.processingPriority?.priority === 'high'),
        medium: summaryResults.filter(r => r.processingPriority?.priority === 'medium'),
        low: summaryResults.filter(r => r.processingPriority?.priority === 'low')
      };

      console.log(`✅ Batch summarization completed: ${summaryResults.length} successful, ${processingErrors.length} errors`);

      return res.json(createResponse({
        summaries: summaryResults,
        processingStats: {
          totalEpisodes: allEpisodes.length,
          ranked: rankedEpisodes.length,
          processed: summaryResults.length,
          errors: processingErrors.length,
          strategy: rankingStrategy
        },
        priorityBreakdown: {
          high: resultsByPriority.high.length,
          medium: resultsByPriority.medium.length,
          low: resultsByPriority.low.length
        },
        errors: processingErrors,
        recommendations: {
          nextToProcess: rankedEpisodes
            .slice(maxEpisodes, maxEpisodes + 3)
            .map(ep => ({
              title: ep.title,
              priority: ep._processingPriority?.priority,
              score: ep._processingPriority?.finalScore,
              reason: this.getProcessingRecommendation(ep)
            }))
        }
      }));

    } catch (error) {
      console.error('Batch summarization error:', error);
      return res.status(500).json(createErrorResponse('Failed to batch summarize episodes'));
    }
  }

  /**
   * Process a single episode for batch summarization
   * @param {Object} episode - Episode object
   * @param {string} summaryType - Type of summary to generate
   * @param {boolean} useFreeSummary - Whether to use free summary service
   * @returns {Object} Summary result
   */
  async processSingleEpisodeForBatch(episode, summaryType, useFreeSummary) {
    const audioUrl = episode.enclosure.url;
    const episodeInfo = {
      title: episode.title,
      pubDate: episode.pubDate,
      duration: episode.itunes?.duration
    };

    // Download and transcribe audio
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    
    const tempDir = path.join(__dirname, '../../uploads');
    const tempFile = path.join(tempDir, `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`);

    try {
      // Download with timeout for batch processing
      const response = await axios({
        method: 'get',
        url: audioUrl,
        responseType: 'stream',
        timeout: 60000, // 1 minute timeout for batch processing
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (response.status !== 200) {
        throw new Error(`Download failed: HTTP ${response.status}`);
      }

      // Save to temp file
      const writer = fs.createWriteStream(tempFile);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Transcribe
      const transcript = await transcriptionService.transcribeAudio(tempFile);
      
      if (!transcript) {
        throw new Error('Transcription failed');
      }

      // Generate summary
      const summaryResult = useFreeSummary
        ? await freeSummaryService.generateEpisodeSummary(transcript, episodeInfo)
        : await summaryService.generateEpisodeSummary(transcript, episodeInfo);

      return {
        summary: summaryResult,
        transcript: transcript,
        transcriptLength: transcript.length
      };

    } finally {
      // Clean up temp file
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup batch temp file:', cleanupError.message);
      }
    }
  }

  /**
   * Get processing recommendation for an episode
   * @param {Object} episode - Episode with scoring data
   * @returns {string} Recommendation reason
   */
  getProcessingRecommendation(episode) {
    const scores = episode._scores;
    if (!scores) return 'High overall relevance';

    const reasons = [];
    if (scores.recency > 0.8) reasons.push('Very recent');
    if (scores.relevance > 0.8) reasons.push('Highly relevant');
    if (scores.engagement > 0.8) reasons.push('High engagement');
    if (scores.duration > 0.8) reasons.push('Optimal duration');

    return reasons.length > 0 ? reasons.join(', ') : 'Balanced quality metrics';
  }

  /**
   * Get summarization queue with episode priorities
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getSummarizationQueue(req, res) {
    try {
      const {
        feedUrl,
        strategy = 'hybrid',
        query = '',
        maxQueueSize = 20
      } = req.body;

      if (!feedUrl) {
        return res.status(400).json(createErrorResponse('Feed URL is required'));
      }

      // Get all episodes
      const allEpisodes = await fetchEpisodes(feedUrl, 0);
      
      if (!allEpisodes || allEpisodes.length === 0) {
        return res.json(createResponse({
          queue: [],
          message: 'No episodes found for summarization queue'
        }));
      }

      // Rank episodes for summarization
      const rankedEpisodes = await episodeRerankingService.rerankEpisodes(allEpisodes, {
        strategy,
        query
      });

      // Create summarization queue
      const queue = rankedEpisodes.slice(0, maxQueueSize).map((episode, index) => ({
        queuePosition: index + 1,
        title: episode.title,
        pubDate: episode.pubDate,
        duration: episode.itunes?.duration,
        audioUrl: episode.enclosure?.url,
        priority: episode._processingPriority?.priority,
        score: episode._processingPriority?.finalScore,
        estimatedProcessingTime: this.estimateProcessingTime(episode),
        canProcess: !!episode.enclosure?.url,
        recommendation: this.getProcessingRecommendation(episode)
      }));

      // Group by priority
      const queueByPriority = {
        high: queue.filter(item => item.priority === 'high'),
        medium: queue.filter(item => item.priority === 'medium'),
        low: queue.filter(item => item.priority === 'low'),
        deferred: queue.filter(item => item.priority === 'deferred')
      };

      return res.json(createResponse({
        queue,
        queueByPriority,
        stats: {
          totalEpisodes: allEpisodes.length,
          queuedForProcessing: queue.length,
          canProcess: queue.filter(item => item.canProcess).length,
          strategy: strategy
        },
        estimatedTotalTime: queue.reduce((total, item) => total + item.estimatedProcessingTime, 0)
      }));

    } catch (error) {
      console.error('Summarization queue error:', error);
      return res.status(500).json(createErrorResponse('Failed to create summarization queue'));
    }
  }

  /**
   * Estimate processing time for an episode
   * @param {Object} episode - Episode object
   * @returns {number} Estimated processing time in minutes
   */
  estimateProcessingTime(episode) {
    // Base processing time: 5 minutes
    let estimatedTime = 5;

    // Adjust based on episode duration if available
    if (episode.itunes?.duration) {
      const duration = this.parseDuration(episode.itunes.duration);
      if (duration > 0) {
        // Longer episodes take more time (roughly 1:5 ratio)
        estimatedTime = Math.max(5, Math.ceil(duration / 300)); // 5 minutes processing per hour of audio
      }
    }

    // Adjust based on content complexity (high engagement = more complex)
    if (episode._scores?.engagement > 0.8) {
      estimatedTime = Math.ceil(estimatedTime * 1.2);
    }

    return estimatedTime;
  }

  /**
   * Parse duration string to seconds
   * @param {string} duration - Duration string
   * @returns {number} Duration in seconds
   */
  parseDuration(duration) {
    if (!duration) return 0;
    
    const parts = duration.split(':').map(p => parseInt(p) || 0);
    
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    
    return 0;
  }

  /**
   * Convert existing episode summary to mind map format
   * @param {Object} summaryData - Existing AI summary data
   * @param {Object} episodeInfo - Episode metadata
   * @returns {Object} Mind map data structure
   */
  static convertSummaryToMindMap(summaryData, episodeInfo) {
    const summary = summaryData.summary;
    
    return {
      title: episodeInfo.title || 'Episode Mind Map',
      overview: summary?.overview || 'AI-generated episode analysis',
      sections: {
        overview: {
          title: '📋 Episode Overview',
          color: '#3b82f6',
          items: summary?.overview ? [summary.overview] : ['Episode summary content']
        },
        keyPoints: {
          title: '🔑 Key Points',
          color: '#10b981',
          items: summary?.keyPoints ? 
            summary.keyPoints.split('\n').filter(point => point.trim()).map(point => point.replace(/^\d+\.\s*/, '')) :
            ['Main discussion points']
        },
        topics: {
          title: '🎯 Topics Covered',
          color: '#8b5cf6',
          items: summary?.topics ? 
            summary.topics.split(',').map(topic => topic.trim()).filter(t => t) :
            ['Episode topics']
        },
        quotes: {
          title: '💬 Notable Quotes',
          color: '#f59e0b',
          items: summary?.quotes ? 
            summary.quotes.split('\n').filter(quote => quote.trim()) :
            summary?.quotes ? [summary.quotes] : ['Notable quotes from episode']
        },
        actions: {
          title: '✅ Action Items',
          color: '#ef4444',
          items: summary?.actionItems ? 
            summary.actionItems.split('\n').filter(action => action.trim()) :
            summary?.actionItems ? [summary.actionItems] : ['Key takeaways']
        }
      },
      metadata: {
        source: 'episode-summary',
        episodeTitle: episodeInfo.title,
        generatedAt: new Date().toISOString()
      }
    };
  }
}

module.exports = new SummaryController();
