const express = require('express');
const router = express.Router();
const { searchPodcast, fetchEpisodes } = require('../services/podcastService');

/**
 * API endpoint to search for a podcast
 */
router.post('/search', async (req, res) => {
  try {
    const { podcastName, limit } = req.body;
    if (!podcastName) {
      return res.status(400).json({ error: 'Podcast name is required' });
    }

    const podcasts = await searchPodcast(podcastName, limit || 10);
    if (podcasts && podcasts.length > 0) {
      return res.json({ podcasts });
    } else {
      return res.status(404).json({ error: `No podcasts found with the name '${podcastName}' on Apple Podcasts` });
    }
  } catch (error) {
    console.error('Error fetching data from Apple Podcasts API:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * API endpoint to fetch episodes for a podcast
 */
router.post('/episodes', async (req, res) => {
  try {
    const { feedUrl, limit } = req.body;
    if (!feedUrl) {
      return res.status(400).json({ error: 'Feed URL is required' });
    }

    const episodes = await fetchEpisodes(feedUrl, limit || 0);
    return res.json({ episodes });
  } catch (error) {
    console.error('Error fetching episodes:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
