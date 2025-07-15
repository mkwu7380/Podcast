const { transcribeAudio } = require('../services/transcriptionService');
const { createResponse, createErrorResponse } = require('../utils/responseHelper');

/**
 * Controller for audio transcription functionality
 */
class TranscriptionController {
  /**
   * Transcribe uploaded audio file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async transcribeAudio(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json(createErrorResponse('Audio file is required'));
      }

      const transcript = await transcribeAudio(req.file.path);
      
      if (transcript) {
        return res.json(createResponse({ transcript }));
      } else {
        return res.status(500).json(createErrorResponse('Transcription failed'));
      }
    } catch (error) {
      console.error('Error transcribing audio:', error.message);
      return res.status(500).json(createErrorResponse('Failed to transcribe audio'));
    }
  }
}

module.exports = new TranscriptionController();
