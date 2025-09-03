const transcriptionService = require('../services/transcriptionService');

// Constants
const CHUNK_PROCESS_INTERVAL = 5;

/**
 * WebSocket handler for real-time audio transcription
 */
class TranscriptionHandler {
  /**
   * Handle new WebSocket connection for transcription
   * @param {WebSocket} ws - WebSocket connection
   */
  handleConnection(ws) {
    let audioBuffers = [];
    let chunkCount = 0;
    const CHUNK_PROCESS_INTERVAL = 5; // Process every 5 chunks

    console.log('New transcription WebSocket connection established');

    ws.on('message', async (data, isBinary) => {
      try {
        if (isBinary) {
          await this.handleAudioData(ws, data, audioBuffers, chunkCount);
          chunkCount++;
        } else {
          await this.handleTextCommand(ws, data.toString(), audioBuffers, chunkCount);
          audioBuffers = []; // Reset after processing final chunk
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ 
          error: 'Failed to process audio data',
          details: error.message 
        }));
      }
    });

    ws.on('close', () => {
      console.log('Transcription WebSocket connection closed');
      audioBuffers = []; // Clean up on disconnect
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Handle binary audio data
   * @param {WebSocket} ws - WebSocket connection
   * @param {Buffer} data - Audio data buffer
   * @param {Array} audioBuffers - Array of audio buffers
   * @param {number} chunkCount - Current chunk count
   */
  async handleAudioData(ws, data, audioBuffers, chunkCount) {
    audioBuffers.push(data);
    
    // Process every N chunks
    if (chunkCount % CHUNK_PROCESS_INTERVAL === 0 && chunkCount > 0) {
      await this.processAudioChunks(ws, audioBuffers, chunkCount);
      audioBuffers.length = 0; // Clear processed buffers
    }
  }

  /**
   * Handle text commands (like 'end')
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} message - Text message
   * @param {Array} audioBuffers - Array of audio buffers
   * @param {number} chunkCount - Current chunk count
   */
  async handleTextCommand(ws, message, audioBuffers, chunkCount) {
    if (message === 'end' && audioBuffers.length > 0) {
      await this.processAudioChunks(ws, audioBuffers, chunkCount, true);
    }
  }

  /**
   * Process accumulated audio chunks
   * @param {WebSocket} ws - WebSocket connection
   * @param {Array} audioBuffers - Array of audio buffers
   * @param {number} chunkCount - Current chunk count
   * @param {boolean} isFinal - Whether this is the final chunk
   */
  async processAudioChunks(ws, audioBuffers, chunkCount, isFinal = false) {
    try {
      const combinedBuffer = Buffer.concat(audioBuffers);
      const transcript = await transcriptionService.processAudioChunk(combinedBuffer);
      
      const response = {
        transcript,
        chunk: chunkCount
      };
      
      if (isFinal) {
        response.final = true;
      }
      
      ws.send(JSON.stringify(response));
    } catch (error) {
      console.error('Error processing audio chunks:', error);
      ws.send(JSON.stringify({ 
        error: 'Transcription failed',
        chunk: chunkCount 
      }));
    }
  }
}

module.exports = new TranscriptionHandler();
