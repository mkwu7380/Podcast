const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Service for handling audio transcription using Whisper
 */
class TranscriptionService {
  /**
   * Transcribe an audio file using Whisper
   * @param {string} audioFilePath - Path to the audio file
   * @returns {Promise<string>} Transcribed text
   */
  async transcribeAudio(audioFilePath) {
    return new Promise((resolve, reject) => {
      try {
        // Verify file exists
        if (!fs.existsSync(audioFilePath)) {
          throw new Error('Audio file not found');
        }

        const python = spawn('python3', ['python/transcribe_whisper.py', audioFilePath]);
        let transcript = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
          transcript += data.toString();
        });

        python.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        python.on('close', (code) => {
          if (code === 0) {
            resolve(transcript.trim());
          } else {
            reject(new Error(`Transcription failed with code ${code}: ${errorOutput}`));
          }
        });

        python.on('error', (error) => {
          reject(new Error(`Failed to start transcription process: ${error.message}`));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Process audio chunks for real-time transcription
   * @param {Buffer} audioBuffer - Audio data buffer
   * @returns {Promise<string>} Transcribed text
   */
  async processAudioChunk(audioBuffer) {
    const tempPath = this.generateTempFilePath();
    
    try {
      // Write buffer to temporary file
      fs.writeFileSync(tempPath, audioBuffer);
      
      // Transcribe the chunk
      const transcript = await this.transcribeAudio(tempPath);
      
      return transcript;
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  /**
   * Generate a unique temporary file path for audio processing
   * @returns {string} Temporary file path
   */
  generateTempFilePath() {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2);
    return path.join('./uploads', `ws_audio_${timestamp}_${randomId}.wav`);
  }
}

module.exports = new TranscriptionService();
