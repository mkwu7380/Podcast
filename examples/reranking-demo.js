/**
 * Comprehensive Demo of the Intelligent Reranking System
 * 重排序模型演示 - Shows both podcast and episode reranking in action
 */

const axios = require('axios');

class RerankingDemo {
  constructor(baseUrl = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  async demonstrateSystem() {
    console.log('🎧 Intelligent Reranking System Demo\n');
    console.log('=' .repeat(60));

    try {
      // 1. Demonstrate Podcast Search Reranking
      await this.demoPodcastSearchReranking();
      
      console.log('\n' + '=' .repeat(60));
      
      // 2. Demonstrate Episode Processing Reranking
      await this.demoEpisodeProcessingReranking();
      
      console.log('\n' + '=' .repeat(60));
      
      // 3. Show Performance Comparison
      await this.demoPerformanceComparison();

    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    }
  }

  /**
   * Demo 1: Podcast Search with Different Reranking Strategies
   */
  async demoPodcastSearchReranking() {
    console.log('\n📱 DEMO 1: Podcast Search Reranking');
    console.log('-' .repeat(40));

    const searchQuery = 'The Daily';
    const strategies = ['hybrid', 'semantic', 'popularity', 'recency'];

    for (const strategy of strategies) {
      console.log(`\n🔍 Searching "${searchQuery}" with ${strategy} strategy:`);
      
      try {
        const response = await axios.post(`${this.baseUrl}/search`, {
          podcastName: searchQuery,
          limit: 5,
          enableReranking: true,
          rankingStrategy: strategy
        });

        if (response.data.success) {
          const { data } = response.data;
          console.log(`   ✅ Found ${data.totalFound} podcasts, showing top ${data.returned}`);
          console.log(`   🧠 Reranking: ${data.reranking.applied ? 'Applied' : 'Not applied'}`);
          
          data.podcasts.slice(0, 3).forEach((podcast, index) => {
            console.log(`   ${index + 1}. ${podcast.collectionName}`);
            console.log(`      by ${podcast.artistName}`);
            if (podcast._scores) {
              console.log(`      📊 Score: ${podcast._scores.final?.toFixed(3)} (S:${podcast._scores.semantic?.toFixed(2)} P:${podcast._scores.popularity?.toFixed(2)} R:${podcast._scores.recency?.toFixed(2)})`);
            }
            if (podcast._ranking) {
              console.log(`      🏆 Rank: #${podcast._ranking.position} via ${podcast._ranking.strategy}`);
            }
          });
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
      }
    }
  }

  /**
   * Demo 2: Episode Processing Pipeline with Reranking
   */
  async demoEpisodeProcessingReranking() {
    console.log('\n📺 DEMO 2: Episode Processing Reranking');
    console.log('-' .repeat(40));

    // First, search for a podcast to get its feed URL
    console.log('\n🔍 Finding a podcast for episode processing...');
    
    try {
      const podcastResponse = await axios.post(`${this.baseUrl}/search`, {
        podcastName: 'NPR News Now',
        limit: 1,
        enableReranking: false
      });

      if (!podcastResponse.data.success || !podcastResponse.data.data.podcasts.length) {
        console.log('❌ Could not find suitable podcast for demo');
        return;
      }

      const podcast = podcastResponse.data.data.podcasts[0];
      const feedUrl = podcast.feedUrl;
      
      console.log(`   ✅ Using "${podcast.collectionName}" by ${podcast.artistName}`);
      console.log(`   📡 Feed URL: ${feedUrl.substring(0, 60)}...`);

      // Demo different episode ranking strategies
      const episodeStrategies = ['hybrid', 'recency', 'engagement', 'duration'];

      for (const strategy of episodeStrategies) {
        console.log(`\n📊 Processing episodes with ${strategy} strategy:`);
        
        try {
          const episodesResponse = await axios.post(`${this.baseUrl}/episodes/for-processing`, {
            feedUrl: feedUrl,
            maxEpisodes: 5,
            strategy: strategy,
            query: 'news update'
          });

          if (episodesResponse.data.success) {
            const { data } = episodesResponse.data;
            console.log(`   ✅ Processed ${data.totalEpisodes} episodes`);
            console.log(`   📈 Processing queues: High(${data.processingQueues.high}) Medium(${data.processingQueues.medium}) Low(${data.processingQueues.low}) Deferred(${data.processingQueues.deferred})`);
            
            console.log('   🎯 Top priority episodes:');
            data.episodes.slice(0, 3).forEach((episode, index) => {
              console.log(`   ${index + 1}. ${episode.title?.substring(0, 50)}...`);
              if (episode._processingPriority) {
                console.log(`      🏆 Priority: ${episode._processingPriority.priority} (Score: ${episode._processingPriority.finalScore?.toFixed(3)})`);
              }
              if (episode._scores) {
                console.log(`      📊 Scores: R:${episode._scores.relevance?.toFixed(2)} T:${episode._scores.recency?.toFixed(2)} E:${episode._scores.engagement?.toFixed(2)} D:${episode._scores.duration?.toFixed(2)}`);
              }
            });

            if (data.recommendations?.processFirst?.length > 0) {
              console.log('   💡 Recommendations:');
              data.recommendations.processFirst.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec.title?.substring(0, 40)}... (${rec.reason})`);
              });
            }
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ Demo setup failed: ${error.message}`);
    }
  }

  /**
   * Demo 3: Performance Comparison
   */
  async demoPerformanceComparison() {
    console.log('\n⚡ DEMO 3: Performance Comparison');
    console.log('-' .repeat(40));

    const searchQuery = 'technology podcast';

    console.log('\n🏃‍♂️ Testing search performance with and without reranking...');

    // Test without reranking
    console.log('\n📊 Without Reranking:');
    const startTime1 = Date.now();
    
    try {
      const response1 = await axios.post(`${this.baseUrl}/search`, {
        podcastName: searchQuery,
        limit: 20,
        enableReranking: false
      });

      const duration1 = Date.now() - startTime1;
      console.log(`   ⏱️  Response time: ${duration1}ms`);
      console.log(`   📦 Results: ${response1.data.data?.totalFound || 0} found, ${response1.data.data?.returned || 0} returned`);
      console.log(`   🧠 Reranking: ${response1.data.data?.reranking?.applied ? 'Applied' : 'Not applied'}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Test with reranking
    console.log('\n📊 With Hybrid Reranking:');
    const startTime2 = Date.now();
    
    try {
      const response2 = await axios.post(`${this.baseUrl}/search`, {
        podcastName: searchQuery,
        limit: 20,
        enableReranking: true,
        rankingStrategy: 'hybrid'
      });

      const duration2 = Date.now() - startTime2;
      console.log(`   ⏱️  Response time: ${duration2}ms`);
      console.log(`   📦 Results: ${response2.data.data?.totalFound || 0} found, ${response2.data.data?.returned || 0} returned`);
      console.log(`   🧠 Reranking: ${response2.data.data?.reranking?.applied ? 'Applied' : 'Not applied'}`);
      
      if (response2.data.data?.reranking?.applied) {
        console.log(`   🎯 Strategy: ${response2.data.data.reranking.strategy}`);
        console.log('   🏆 Top 3 reranked results:');
        
        response2.data.data.podcasts.slice(0, 3).forEach((podcast, index) => {
          console.log(`   ${index + 1}. ${podcast.collectionName}`);
          if (podcast._scores) {
            console.log(`      📊 Final Score: ${podcast._scores.final?.toFixed(3)}`);
          }
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  /**
   * Display available strategies
   */
  async showAvailableStrategies() {
    console.log('\n🎛️  Available Strategies:');
    console.log('-' .repeat(40));

    try {
      // Show podcast ranking strategies
      const podcastStrategies = await axios.get(`${this.baseUrl}/ranking-strategies`);
      console.log('\n📱 Podcast Ranking Strategies:');
      Object.entries(podcastStrategies.data.data.strategies).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });

      // Show episode ranking strategies
      const episodeStrategies = await axios.get(`${this.baseUrl}/episode-ranking-strategies`);
      console.log('\n📺 Episode Ranking Strategies:');
      Object.entries(episodeStrategies.data.data.strategies).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });

    } catch (error) {
      console.log(`❌ Could not fetch strategies: ${error.message}`);
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const demo = new RerankingDemo();
  
  (async () => {
    console.log('🚀 Starting Intelligent Reranking System Demo...\n');
    console.log('Make sure your server is running at http://localhost:3001\n');

    await demo.showAvailableStrategies();
    await demo.demonstrateSystem();
    
    console.log('\n🎉 Demo completed!');
    console.log('\nThe reranking system provides:');
    console.log('✅ Improved search relevance');
    console.log('✅ Intelligent episode processing prioritization');
    console.log('✅ Multiple configurable strategies');
    console.log('✅ Real-time performance optimization');
    console.log('✅ Comprehensive scoring and metadata');
  })();
}

module.exports = RerankingDemo;
