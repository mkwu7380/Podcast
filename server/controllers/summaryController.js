const summaryService = require('../services/summaryService');
const summaryServiceNew = require('../services/summaryServiceNew');
const freeSummaryService = require('../services/freeSummaryService');
const transcriptionService = require('../services/transcriptionService');
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
