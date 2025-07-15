const { searchPodcast, fetchEpisodes } = require('../../services/podcastService');
const { createResponse, createErrorResponse } = require('../utils/responseHelper');

/**
 * Controller for podcast search functionality
 */
class PodcastController {
  /**
   * Search for podcasts
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchPodcasts(req, res) {
    try {
      const { podcastName, limit } = req.body;
      
      if (!podcastName) {
        return res.status(400).json(createErrorResponse('Podcast name is required'));
      }

      const podcasts = await searchPodcast(podcastName, limit || 10);
      
      if (podcasts && podcasts.length > 0) {
        return res.json(createResponse({ podcasts }));
      } else {
        return res.status(404).json(
          createErrorResponse(`No podcasts found with the name '${podcastName}' on Apple Podcasts`)
        );
      }
    } catch (error) {
      console.error('Error searching podcasts:', error.message);
      return res.status(500).json(createErrorResponse('Failed to search podcasts'));
    }
  }

  /**
   * Fetch episodes for a podcast
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEpisodes(req, res) {
    try {
      const { feedUrl, limit } = req.body;
      
      if (!feedUrl) {
        return res.status(400).json(createErrorResponse('Feed URL is required'));
      }

      const episodes = await fetchEpisodes(feedUrl, limit || 0);
      return res.json(createResponse({ episodes }));
    } catch (error) {
      console.error('Error fetching episodes:', error.message);
      return res.status(500).json(createErrorResponse('Failed to fetch episodes'));
    }
  }
}

module.exports = new PodcastController();
