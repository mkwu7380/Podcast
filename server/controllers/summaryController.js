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
        // Download audio file with proper headers to avoid 403 errors
        const response = await axios({
          method: 'get',
          url: audioUrl,
          responseType: 'stream',
          timeout: 60000, // 1 minute timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'audio/mpeg, audio/mp4, audio/wav, audio/*, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        });

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
      console.error('Episode URL summarization error:', error);
      res.status(500).json(createErrorResponse(error.message || 'Failed to summarize episode from URL'));
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
      const { transcript, episodeInfo = {} } = req.body;

      if (!transcript || !transcript.trim()) {
        return res.status(400).json(createErrorResponse('Transcript is required'));
      }

      // Use the new modular summary service for mind map generation
      const mindMapData = await summaryServiceNew.generateMindMap(transcript, episodeInfo);

      res.json(createResponse('Mind map generated successfully', {
        mindMap: mindMapData,
        metadata: {
          transcriptLength: transcript.length,
          processingTime: new Date().toISOString(),
          aiConfigured: summaryServiceNew.isAiConfigured()
        }
      }));

    } catch (error) {
      console.error('Mind map generation error:', error);
      res.status(500).json(createErrorResponse('Failed to generate mind map', {
        error: error.message
      }));
    }
  }
}

module.exports = new SummaryController();
