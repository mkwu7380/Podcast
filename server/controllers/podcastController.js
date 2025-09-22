const { searchPodcast, fetchEpisodes } = require('../../services/podcastService');
const { createResponse, createErrorResponse } = require('../utils/responseHelper');
const rerankingService = require('../../services/rerankingService');
const episodeRerankingService = require('../../services/episodeRerankingService');

/**
 * Controller for podcast search functionality with advanced reranking
 */
class PodcastController {
  /**
   * Search for podcasts with intelligent reranking
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchPodcasts(req, res) {
    try {
      const { 
        podcastName, 
        limit,
        // Reranking options
        rankingStrategy = 'hybrid',
        rankingWeights,
        enableReranking = true
      } = req.body;
      
      if (!podcastName) {
        return res.status(400).json(createErrorResponse('Podcast name is required'));
      }

      console.log(`🔍 Searching for podcasts: "${podcastName}" with ${enableReranking ? rankingStrategy : 'no'} reranking`);

      // Get initial search results from iTunes API
      const rawPodcasts = await searchPodcast(podcastName, limit || 50);
      
      if (!rawPodcasts || rawPodcasts.length === 0) {
        return res.status(404).json(
          createErrorResponse(`No podcasts found with the name '${podcastName}' on Apple Podcasts`)
        );
      }

      let finalPodcasts = rawPodcasts;

      // Apply reranking if enabled
      if (enableReranking && rawPodcasts.length > 1) {
        try {
          const rerankingOptions = {
            strategy: rankingStrategy,
            weights: rankingWeights
          };

          finalPodcasts = await rerankingService.rerank(
            rawPodcasts, 
            podcastName, 
            rerankingOptions
          );

          console.log(`📊 Reranking applied: ${rawPodcasts.length} results reordered using ${rankingStrategy} strategy`);
        } catch (rerankError) {
          console.warn('⚠️ Reranking failed, using original order:', rerankError.message);
          // Continue with original results if reranking fails
        }
      }

      // Apply final limit if specified and different from search limit
      const requestedLimit = limit || 10;
      if (finalPodcasts.length > requestedLimit) {
        finalPodcasts = finalPodcasts.slice(0, requestedLimit);
      }

      // Add search metadata
      const responseData = {
        podcasts: finalPodcasts,
        searchQuery: podcastName,
        totalFound: rawPodcasts.length,
        returned: finalPodcasts.length,
        reranking: {
          enabled: enableReranking,
          strategy: enableReranking ? rankingStrategy : null,
          applied: enableReranking && rawPodcasts.length > 1
        }
      };

      return res.json(createResponse(responseData));

    } catch (error) {
      console.error('Error searching podcasts:', error.message);
      return res.status(500).json(createErrorResponse('Failed to search podcasts'));
    }
  }

  /**
   * Fetch episodes for a podcast with intelligent reranking for processing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEpisodes(req, res) {
    try {
      const { 
        feedUrl, 
        limit,
        // Episode reranking options for processing pipeline
        enableEpisodeReranking = true,
        episodeRankingStrategy = 'hybrid',
        episodeQuery = '',
        userPreferences = {},
        prioritizeForProcessing = false
      } = req.body;
      
      if (!feedUrl) {
        return res.status(400).json(createErrorResponse('Feed URL is required'));
      }

      console.log(`📺 Fetching episodes from feed with ${enableEpisodeReranking ? episodeRankingStrategy : 'no'} reranking`);

      // Get raw episodes from RSS feed
      const rawEpisodes = await fetchEpisodes(feedUrl, limit || 0);
      
      if (!rawEpisodes || rawEpisodes.length === 0) {
        return res.json(createResponse({ 
          episodes: [],
          message: 'No episodes found in this podcast feed'
        }));
      }

      let finalEpisodes = rawEpisodes;

      // Apply episode reranking if enabled (especially important for processing pipeline)
      if (enableEpisodeReranking && rawEpisodes.length > 1) {
        try {
          const rerankingOptions = {
            strategy: episodeRankingStrategy,
            query: episodeQuery,
            userPreferences: userPreferences
          };

          finalEpisodes = await episodeRerankingService.rerankEpisodes(
            rawEpisodes,
            rerankingOptions
          );

          console.log(`📊 Episode reranking applied: ${rawEpisodes.length} episodes reordered for processing`);
          
          if (prioritizeForProcessing) {
            // Log top priority episodes for processing
            const topEpisodes = finalEpisodes.slice(0, 5);
            console.log(`🎯 Top priority episodes for processing:`, 
              topEpisodes.map(ep => ({
                title: ep.title?.substring(0, 50) + '...',
                priority: ep._processingPriority?.priority,
                score: ep._processingPriority?.finalScore?.toFixed(3)
              }))
            );
          }

        } catch (rerankError) {
          console.warn('⚠️ Episode reranking failed, using original order:', rerankError.message);
          // Continue with original episodes if reranking fails
        }
      }

      // Apply final limit if specified
      const requestedLimit = limit || finalEpisodes.length;
      if (finalEpisodes.length > requestedLimit && requestedLimit > 0) {
        finalEpisodes = finalEpisodes.slice(0, requestedLimit);
      }

      // Prepare response with episode processing metadata
      const responseData = {
        episodes: finalEpisodes,
        feedUrl: feedUrl,
        totalFound: rawEpisodes.length,
        returned: finalEpisodes.length,
        episodeReranking: {
          enabled: enableEpisodeReranking,
          strategy: enableEpisodeReranking ? episodeRankingStrategy : null,
          applied: enableEpisodeReranking && rawEpisodes.length > 1,
          prioritizedForProcessing: prioritizeForProcessing
        }
      };

      return res.json(createResponse(responseData));

    } catch (error) {
      console.error('Error fetching episodes:', error.message);
      return res.status(500).json(createErrorResponse('Failed to fetch episodes'));
    }
  }

  /**
   * Get processing-optimized episodes for summarization pipeline
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEpisodesForProcessing(req, res) {
    try {
      const { 
        feedUrl,
        maxEpisodes = 10,
        strategy = 'hybrid',
        query = '',
        userPreferences = {}
      } = req.body;

      if (!feedUrl) {
        return res.status(400).json(createErrorResponse('Feed URL is required'));
      }

      console.log(`🔄 Fetching episodes optimized for processing pipeline`);

      // Get all episodes first
      const allEpisodes = await fetchEpisodes(feedUrl, 0); // Get all episodes

      if (!allEpisodes || allEpisodes.length === 0) {
        return res.json(createResponse({ 
          episodes: [],
          processingQueue: [],
          message: 'No episodes available for processing'
        }));
      }

      // Apply intelligent reranking for processing priority
      const rankedEpisodes = await episodeRerankingService.rerankEpisodes(allEpisodes, {
        strategy,
        query,
        userPreferences
      });

      // Create processing queues based on priority
      const processingQueues = {
        high: rankedEpisodes.filter(ep => ep._processingPriority?.priority === 'high'),
        medium: rankedEpisodes.filter(ep => ep._processingPriority?.priority === 'medium'),
        low: rankedEpisodes.filter(ep => ep._processingPriority?.priority === 'low'),
        deferred: rankedEpisodes.filter(ep => ep._processingPriority?.priority === 'deferred')
      };

      // Get top episodes for immediate processing
      const topEpisodes = rankedEpisodes.slice(0, maxEpisodes);

      console.log(`📈 Processing queues created: ${processingQueues.high.length} high, ${processingQueues.medium.length} medium, ${processingQueues.low.length} low priority episodes`);

      return res.json(createResponse({
        episodes: topEpisodes,
        processingQueues: {
          high: processingQueues.high.length,
          medium: processingQueues.medium.length, 
          low: processingQueues.low.length,
          deferred: processingQueues.deferred.length
        },
        totalEpisodes: allEpisodes.length,
        strategy: strategy,
        optimizedForProcessing: true,
        recommendations: {
          processFirst: processingQueues.high.slice(0, 3).map(ep => ({
            title: ep.title,
            score: ep._processingPriority?.finalScore,
            reason: this.getProcessingRecommendation(ep)
          }))
        }
      }));

    } catch (error) {
      console.error('Error getting episodes for processing:', error.message);
      return res.status(500).json(createErrorResponse('Failed to get episodes for processing'));
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
   * Get available reranking strategies
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRankingStrategies(req, res) {
    try {
      const strategies = rerankingService.getAvailableStrategies();
      return res.json(createResponse({ strategies }));
    } catch (error) {
      console.error('Error getting ranking strategies:', error.message);
      return res.status(500).json(createErrorResponse('Failed to get ranking strategies'));
    }
  }

  /**
   * Get available episode ranking strategies
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEpisodeRankingStrategies(req, res) {
    try {
      const strategies = episodeRerankingService.getAvailableStrategies();
      return res.json(createResponse({ strategies }));
    } catch (error) {
      console.error('Error getting episode ranking strategies:', error.message);
      return res.status(500).json(createErrorResponse('Failed to get episode ranking strategies'));
    }
  }
}

module.exports = new PodcastController();
