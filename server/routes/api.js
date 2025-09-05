const express = require('express');
const router = express.Router();
const podcastController = require('../controllers/podcastController');
const transcriptionController = require('../controllers/transcriptionController');
const summaryController = require('../controllers/summaryController');
const upload = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * /api/search:
 *   post:
 *     summary: Search for podcasts
 *     tags: [Podcasts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               podcastName:
 *                 type: string
 *                 description: Name of the podcast to search for
 *               limit:
 *                 type: number
 *                 description: Maximum number of results
 *     responses:
 *       200:
 *         description: Successful search
 *       400:
 *         description: Invalid request
 *       404:
 *         description: No podcasts found
 */
router.post('/search', podcastController.searchPodcasts);

/**
 * @swagger
 * /api/generate-mindmap:
 *   post:
 *     summary: Generate mind map from transcript
 *     tags: [AI Summary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transcript:
 *                 type: string
 *                 description: Episode transcript text
 *               episodeInfo:
 *                 type: object
 *                 description: Episode metadata (title, description)
 *     responses:
 *       200:
 *         description: Mind map generated successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Generation failed
 */
router.post('/generate-mindmap', summaryController.generateMindMap);

/**
 * @swagger
 * /api/episodes:
 *   post:
 *     summary: Fetch episodes for a podcast
 *     tags: [Podcasts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feedUrl:
 *                 type: string
 *                 description: RSS feed URL of the podcast
 *               limit:
 *                 type: number
 *                 description: Number of episodes to fetch
 *     responses:
 *       200:
 *         description: Episodes retrieved successfully
 *       400:
 *         description: Invalid request
 */
router.post('/episodes', podcastController.getEpisodes);

/**
 * @swagger
 * /api/transcribe:
 *   post:
 *     summary: Transcribe an audio file
 *     tags: [Transcription]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file to transcribe
 *     responses:
 *       200:
 *         description: Transcription successful
 *       400:
 *         description: Invalid request or no audio file
 *       500:
 *         description: Transcription failed
 */
router.post('/transcribe', upload.single('audio'), transcriptionController.transcribeAudio);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * @swagger
 * /api/summary/audio:
 *   post:
 *     summary: Summarize uploaded audio file
 *     tags: [Summary]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: audio
 *         type: file
 *         required: true
 *         description: Audio file to transcribe and summarize
 *       - in: formData
 *         name: type
 *         type: string
 *         enum: [brief, comprehensive, detailed, bullet-points]
 *         description: Type of summary to generate
 *       - in: formData
 *         name: episodeSummary
 *         type: boolean
 *         description: Generate structured episode summary
 *       - in: formData
 *         name: title
 *         type: string
 *         description: Episode title
 *       - in: formData
 *         name: pubDate
 *         type: string
 *         description: Episode publication date
 *     responses:
 *       200:
 *         description: Audio summarized successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/summary/audio', upload.single('audio'), summaryController.summarizeAudio);

/**
 * @swagger
 * /api/summary/transcript:
 *   post:
 *     summary: Summarize provided transcript text
 *     tags: [Summary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transcript
 *             properties:
 *               transcript:
 *                 type: string
 *                 description: Text transcript to summarize
 *               type:
 *                 type: string
 *                 enum: [brief, comprehensive, detailed, bullet-points]
 *                 description: Type of summary to generate
 *               episodeInfo:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   pubDate:
 *                     type: string
 *                   duration:
 *                     type: string
 *     responses:
 *       200:
 *         description: Transcript summarized successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/summary/transcript', summaryController.summarizeTranscript);

/**
 * @swagger
 * /api/summary/episode-url:
 *   post:
 *     summary: Summarize podcast episode from audio URL
 *     tags: [Summary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - audioUrl
 *             properties:
 *               audioUrl:
 *                 type: string
 *                 description: URL of the audio file to download and summarize
 *               summaryType:
 *                 type: string
 *                 enum: [brief, comprehensive, detailed, bullet-points]
 *               episodeInfo:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   pubDate:
 *                     type: string
 *                   duration:
 *                     type: string
 *     responses:
 *       200:
 *         description: Episode summarized successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/summary/episode-url', summaryController.summarizeEpisodeFromUrl);

/**
 * @swagger
 * /api/summary/status:
 *   get:
 *     summary: Get AI summarization service status
 *     tags: [Summary]
 *     responses:
 *       200:
 *         description: Service status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     aiConfigured:
 *                       type: boolean
 *                     availableTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     features:
 *                       type: object
 *                     fallbackMode:
 *                       type: boolean
 */
router.get('/summary/status', summaryController.getServiceStatus);

module.exports = router;
