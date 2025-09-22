/**
 * Integration Tests for Complete Reranking System
 * Tests both podcast search reranking and episode processing reranking
 */

const request = require('supertest');
const app = require('../server/index');

describe('Intelligent Reranking System Integration Tests', () => {
  
  describe('Podcast Search Reranking', () => {
    
    test('should search podcasts with hybrid reranking enabled', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({
          podcastName: 'The Daily',
          limit: 10,
          enableReranking: true,
          rankingStrategy: 'hybrid'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.podcasts).toBeDefined();
      expect(response.body.data.reranking.enabled).toBe(true);
      expect(response.body.data.reranking.strategy).toBe('hybrid');
      
      // Check if reranking metadata is present
      if (response.body.data.podcasts.length > 1) {
        expect(response.body.data.reranking.applied).toBe(true);
        const firstPodcast = response.body.data.podcasts[0];
        expect(firstPodcast._scores).toBeDefined();
        expect(firstPodcast._ranking).toBeDefined();
      }
    });

    test('should support different ranking strategies', async () => {
      const strategies = ['semantic', 'popularity', 'recency', 'hybrid'];
      
      for (const strategy of strategies) {
        const response = await request(app)
          .post('/api/search')
          .send({
            podcastName: 'news',
            limit: 5,
            enableReranking: true,
            rankingStrategy: strategy
          })
          .expect(200);

        expect(response.body.data.reranking.strategy).toBe(strategy);
      }
    });

    test('should disable reranking when requested', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({
          podcastName: 'The Daily',
          limit: 5,
          enableReranking: false
        })
        .expect(200);

      expect(response.body.data.reranking.enabled).toBe(false);
      expect(response.body.data.reranking.applied).toBe(false);
    });
  });

  describe('Episode Processing Reranking', () => {
    
    let testFeedUrl;

    beforeAll(async () => {
      // Get a podcast feed URL for testing
      const podcastResponse = await request(app)
        .post('/api/search')
        .send({
          podcastName: 'NPR',
          limit: 1,
          enableReranking: false
        });

      if (podcastResponse.body.success && podcastResponse.body.data.podcasts.length > 0) {
        testFeedUrl = podcastResponse.body.data.podcasts[0].feedUrl;
      }
    });

    test('should fetch episodes with reranking enabled', async () => {
      if (!testFeedUrl) {
        console.log('Skipping episode test - no feed URL available');
        return;
      }

      const response = await request(app)
        .post('/api/episodes')
        .send({
          feedUrl: testFeedUrl,
          limit: 10,
          enableEpisodeReranking: true,
          episodeRankingStrategy: 'hybrid',
          prioritizeForProcessing: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.episodes).toBeDefined();
      expect(response.body.data.episodeReranking.enabled).toBe(true);
      expect(response.body.data.episodeReranking.strategy).toBe('hybrid');

      // Check processing priority metadata
      if (response.body.data.episodes.length > 0) {
        const firstEpisode = response.body.data.episodes[0];
        expect(firstEpisode._processingPriority).toBeDefined();
        expect(firstEpisode._scores).toBeDefined();
      }
    });

    test('should get processing-optimized episodes', async () => {
      if (!testFeedUrl) {
        console.log('Skipping processing test - no feed URL available');
        return;
      }

      const response = await request(app)
        .post('/api/episodes/for-processing')
        .send({
          feedUrl: testFeedUrl,
          maxEpisodes: 5,
          strategy: 'hybrid',
          query: 'news update'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.episodes).toBeDefined();
      expect(response.body.data.processingQueues).toBeDefined();
      expect(response.body.data.optimizedForProcessing).toBe(true);

      // Check processing queues
      const queues = response.body.data.processingQueues;
      expect(typeof queues.high).toBe('number');
      expect(typeof queues.medium).toBe('number');
      expect(typeof queues.low).toBe('number');
      expect(typeof queues.deferred).toBe('number');

      // Check recommendations
      if (response.body.data.recommendations?.processFirst) {
        expect(Array.isArray(response.body.data.recommendations.processFirst)).toBe(true);
      }
    });

    test('should support different episode ranking strategies', async () => {
      if (!testFeedUrl) {
        console.log('Skipping episode strategies test - no feed URL available');
        return;
      }

      const strategies = ['relevance', 'recency', 'engagement', 'duration', 'hybrid'];
      
      for (const strategy of strategies) {
        const response = await request(app)
          .post('/api/episodes')
          .send({
            feedUrl: testFeedUrl,
            limit: 3,
            enableEpisodeReranking: true,
            episodeRankingStrategy: strategy
          })
          .expect(200);

        expect(response.body.data.episodeReranking.strategy).toBe(strategy);
      }
    });
  });

  describe('Strategy Endpoints', () => {
    
    test('should get podcast ranking strategies', async () => {
      const response = await request(app)
        .get('/api/ranking-strategies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.strategies).toBeDefined();
      expect(response.body.data.strategies.SEMANTIC).toBe('semantic');
      expect(response.body.data.strategies.HYBRID).toBe('hybrid');
    });

    test('should get episode ranking strategies', async () => {
      const response = await request(app)
        .get('/api/episode-ranking-strategies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.strategies).toBeDefined();
      expect(response.body.data.strategies.RELEVANCE).toBe('relevance');
      expect(response.body.data.strategies.HYBRID).toBe('hybrid');
    });
  });

  describe('Error Handling', () => {
    
    test('should handle missing podcast name gracefully', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({
          enableReranking: true,
          rankingStrategy: 'hybrid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    test('should handle missing feed URL gracefully', async () => {
      const response = await request(app)
        .post('/api/episodes')
        .send({
          enableEpisodeReranking: true,
          episodeRankingStrategy: 'hybrid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    test('should handle invalid ranking strategy gracefully', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({
          podcastName: 'test',
          enableReranking: true,
          rankingStrategy: 'invalid_strategy'
        })
        .expect(200); // Should fallback to default strategy

      expect(response.body.success).toBe(true);
      // Should use default strategy or handle gracefully
    });
  });

  describe('Performance Tests', () => {
    
    test('should complete podcast reranking within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/search')
        .send({
          podcastName: 'technology',
          limit: 20,
          enableReranking: true,
          rankingStrategy: 'hybrid'
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(response.body.success).toBe(true);
    });

    test('should handle large episode lists efficiently', async () => {
      // This test would need a feed with many episodes
      // Skip if no suitable test feed is available
      if (!testFeedUrl) {
        console.log('Skipping performance test - no feed URL available');
        return;
      }

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/episodes/for-processing')
        .send({
          feedUrl: testFeedUrl,
          maxEpisodes: 50,
          strategy: 'hybrid'
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(response.body.success).toBe(true);
    });
  });
});

// Mock data for testing if needed
const mockPodcastData = {
  collectionName: "Test Podcast",
  artistName: "Test Artist",
  feedUrl: "https://example.com/rss",
  trackCount: 100,
  primaryGenreName: "News",
  artworkUrl600: "https://example.com/artwork.jpg"
};

const mockEpisodeData = {
  title: "Test Episode",
  pubDate: new Date().toISOString(),
  content: "This is a test episode content with relevant keywords",
  enclosure: { length: "50000000" }, // ~50MB
  itunes: {
    duration: "45:30",
    explicit: "no",
    image: "https://example.com/episode.jpg"
  }
};

module.exports = {
  mockPodcastData,
  mockEpisodeData
};
