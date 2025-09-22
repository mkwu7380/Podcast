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
 *     summary: Search for podcasts with intelligent reranking
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
 *                 description: Maximum number of results to return
 *               enableReranking:
 *                 type: boolean
 *                 description: Whether to apply intelligent reranking
 *                 default: true
 *               rankingStrategy:
 *                 type: string
 *                 enum: [semantic, popularity, recency, hybrid]
 *                 description: Reranking strategy to apply
 *                 default: hybrid
 *               rankingWeights:
 *                 type: object
 *                 description: Custom weights for hybrid ranking
 *                 properties:
 *                   semantic:
 *                     type: number
 *                   popularity:
 *                     type: number
 *                   recency:
 *                     type: number
 *     responses:
 *       200:
 *         description: Successful search with reranked results
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
 *                     podcasts:
 *                       type: array
 *                       items:
 *                         type: object
 *                     searchQuery:
 *                       type: string
 *                     totalFound:
 *                       type: number
 *                     returned:
 *                       type: number
 *                     reranking:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                         strategy:
 *                           type: string
 *                         applied:
 *                           type: boolean
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
 * /api/summary/batch-episodes:
 *   post:
 *     summary: Batch summarize episodes with intelligent prioritization
 *     tags: [Summary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedUrl
 *             properties:
 *               feedUrl:
 *                 type: string
 *                 description: RSS feed URL of the podcast
 *               maxEpisodes:
 *                 type: number
 *                 description: Maximum number of episodes to process
 *                 default: 5
 *               summaryType:
 *                 type: string
 *                 enum: [brief, comprehensive, detailed, bullet-points]
 *                 description: Type of summary to generate
 *                 default: comprehensive
 *               rankingStrategy:
 *                 type: string
 *                 enum: [relevance, recency, engagement, duration, hybrid]
 *                 description: Episode prioritization strategy
 *                 default: hybrid
 *               query:
 *                 type: string
 *                 description: Query for relevance-based prioritization
 *               userPreferences:
 *                 type: object
 *                 description: User preferences for episode filtering
 *               processHighPriorityOnly:
 *                 type: boolean
 *                 description: Only process high-priority episodes
 *                 default: false
 *     responses:
 *       200:
 *         description: Episodes summarized with priority information
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
 *                     summaries:
 *                       type: array
 *                       items:
 *                         type: object
 *                     processingStats:
 *                       type: object
 *                     priorityBreakdown:
 *                       type: object
 *                     recommendations:
 *                       type: object
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/summary/batch-episodes', summaryController.batchSummarizeEpisodes);

/**
 * @swagger
 * /api/summary/queue:
 *   post:
 *     summary: Get intelligent summarization queue with episode priorities
 *     tags: [Summary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedUrl
 *             properties:
 *               feedUrl:
 *                 type: string
 *                 description: RSS feed URL of the podcast
 *               strategy:
 *                 type: string
 *                 enum: [relevance, recency, engagement, duration, hybrid]
 *                 description: Prioritization strategy
 *                 default: hybrid
 *               query:
 *                 type: string
 *                 description: Query for relevance scoring
 *               maxQueueSize:
 *                 type: number
 *                 description: Maximum episodes in queue
 *                 default: 20
 *     responses:
 *       200:
 *         description: Summarization queue with priorities
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
 *                     queue:
 *                       type: array
 *                       items:
 *                         type: object
 *                     queueByPriority:
 *                       type: object
 *                     stats:
 *                       type: object
 *                     estimatedTotalTime:
 *                       type: number
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/summary/queue', summaryController.getSummarizationQueue);

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

/**
 * @swagger
 * /api/ranking-strategies:
 *   get:
 *     summary: Get available reranking strategies
 *     tags: [Podcasts]
 *     responses:
 *       200:
 *         description: Available ranking strategies
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
 *                     strategies:
 *                       type: object
 *                       properties:
 *                         SEMANTIC:
 *                           type: string
 *                         POPULARITY:
 *                           type: string
 *                         RECENCY:
 *                           type: string
 *                         HYBRID:
 *                           type: string
 *       500:
 *         description: Server error
 */
router.get('/ranking-strategies', podcastController.getRankingStrategies);

/**
 * @swagger
 * /api/episode-ranking-strategies:
 *   get:
 *     summary: Get available episode ranking strategies for processing pipeline
 *     tags: [Podcasts]
 *     responses:
 *       200:
 *         description: Available episode ranking strategies
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
 *                     strategies:
 *                       type: object
 *                       properties:
 *                         RELEVANCE:
 *                           type: string
 *                         RECENCY:
 *                           type: string
 *                         ENGAGEMENT:
 *                           type: string
 *                         DURATION:
 *                           type: string
 *                         HYBRID:
 *                           type: string
 *       500:
 *         description: Server error
 */
router.get('/episode-ranking-strategies', podcastController.getEpisodeRankingStrategies);

module.exports = router;
