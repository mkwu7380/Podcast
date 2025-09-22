/**
 * Intelligent Summarization Demo with Episode Reranking
 * 智能摘要演示 - Shows how episode reranking optimizes summarization workflow
 */

const axios = require('axios');

class IntelligentSummarizationDemo {
  constructor(baseUrl = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  async demonstrateIntelligentSummarization() {
    console.log('🧠 Intelligent Podcast Summarization Demo\n');
    console.log('=' .repeat(60));

    try {
      // 1. Show how to create a prioritized summarization queue
      await this.demoSummarizationQueue();
      
      console.log('\n' + '=' .repeat(60));
      
      // 2. Demonstrate batch summarization with reranking
      await this.demoBatchSummarization();
      
      console.log('\n' + '=' .repeat(60));
      
      // 3. Show strategy comparison for summarization
      await this.demoSummarizationStrategies();

    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    }
  }

  /**
   * Demo 1: Create Intelligent Summarization Queue
   */
  async demoSummarizationQueue() {
    console.log('\n📋 DEMO 1: Intelligent Summarization Queue');
    console.log('-' .repeat(40));

    try {
      // First, get a podcast for testing
      console.log('🔍 Finding a suitable podcast for queue demo...');
      
      const podcastResponse = await axios.post(`${this.baseUrl}/search`, {
        podcastName: 'news',
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

      // Test different prioritization strategies for summarization
      const strategies = ['hybrid', 'recency', 'relevance', 'engagement'];

      for (const strategy of strategies) {
        console.log(`\n🎯 Creating summarization queue with ${strategy} strategy:`);
        
        try {
          const queueResponse = await axios.post(`${this.baseUrl}/summary/queue`, {
            feedUrl: feedUrl,
            strategy: strategy,
            query: 'interview analysis news',
            maxQueueSize: 10
          });

          if (queueResponse.data.success) {
            const { data } = queueResponse.data;
            console.log(`   ✅ Queue created: ${data.queue.length} episodes prioritized`);
            console.log(`   📊 Can process: ${data.stats.canProcess}/${data.stats.totalEpisodes} episodes`);
            console.log(`   ⏱️  Estimated total time: ${data.estimatedTotalTime} minutes`);
            
            // Show priority distribution
            const priorities = data.queueByPriority;
            console.log(`   🏆 Priority breakdown: High(${priorities.high?.length || 0}) Medium(${priorities.medium?.length || 0}) Low(${priorities.low?.length || 0}) Deferred(${priorities.deferred?.length || 0})`);
            
            // Show top 3 episodes to process
            console.log('   🎯 Top episodes for summarization:');
            data.queue.slice(0, 3).forEach((episode, index) => {
              console.log(`   ${index + 1}. ${episode.title?.substring(0, 60)}...`);
              console.log(`      📊 Priority: ${episode.priority} | Score: ${episode.score?.toFixed(3)} | Est. ${episode.estimatedProcessingTime}min`);
              console.log(`      💡 Reason: ${episode.recommendation}`);
            });
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ Queue demo failed: ${error.message}`);
    }
  }

  /**
   * Demo 2: Batch Summarization with Intelligent Reranking
   */
  async demoBatchSummarization() {
    console.log('\n📝 DEMO 2: Batch Summarization with Reranking');
    console.log('-' .repeat(40));

    try {
      // Find a podcast with shorter episodes for demo
      console.log('🔍 Finding podcast suitable for batch summarization...');
      
      const podcastResponse = await axios.post(`${this.baseUrl}/search`, {
        podcastName: 'daily news brief',
        limit: 1,
        enableReranking: true,
        rankingStrategy: 'hybrid'
      });

      if (!podcastResponse.data.success || !podcastResponse.data.data.podcasts.length) {
        console.log('❌ Could not find suitable podcast for batch demo');
        return;
      }

      const podcast = podcastResponse.data.data.podcasts[0];
      const feedUrl = podcast.feedUrl;
      
      console.log(`   ✅ Using "${podcast.collectionName}" for batch processing`);

      // Demo different batch processing modes
      const batchModes = [
        {
          name: 'High Priority Only',
          config: {
            maxEpisodes: 3,
            rankingStrategy: 'hybrid',
            processHighPriorityOnly: true,
            query: 'breaking news important'
          }
        },
        {
          name: 'Recent Content Focus',
          config: {
            maxEpisodes: 3,
            rankingStrategy: 'recency',
            query: 'latest update'
          }
        },
        {
          name: 'Balanced Approach',
          config: {
            maxEpisodes: 2,
            rankingStrategy: 'hybrid',
            summaryType: 'brief'
          }
        }
      ];

      for (const mode of batchModes) {
        console.log(`\n🚀 Testing ${mode.name}:`);
        
        try {
          // Note: In a real demo, you might want to use a test endpoint
          // that doesn't actually process audio to avoid long wait times
          const batchRequest = {
            feedUrl: feedUrl,
            ...mode.config
          };

          console.log(`   🔄 Would process ${mode.config.maxEpisodes} episodes with ${mode.config.rankingStrategy} strategy`);
          console.log(`   📊 Configuration:`, JSON.stringify(mode.config, null, 2).split('\n').map(line => `   ${line}`).join('\n'));
          console.log(`   ✅ Batch request prepared (not executed in demo to avoid processing time)`);
          
          // In a real scenario, you would uncomment this:
          // const batchResponse = await axios.post(`${this.baseUrl}/summary/batch-episodes`, batchRequest);
          
          // Show what the expected response would contain
          console.log(`   📝 Expected response would include:`);
          console.log(`      - Summaries array with processing priority metadata`);
          console.log(`      - Processing stats and priority breakdown`);
          console.log(`      - Error handling for failed episodes`);
          console.log(`      - Recommendations for next episodes to process`);

        } catch (error) {
          console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ Batch summarization demo failed: ${error.message}`);
    }
  }

  /**
   * Demo 3: Compare Summarization Strategies
   */
  async demoSummarizationStrategies() {
    console.log('\n📊 DEMO 3: Summarization Strategy Comparison');
    console.log('-' .repeat(40));

    // Show how different strategies affect episode prioritization for summarization
    const strategies = {
      'hybrid': 'Balanced approach - best for general summarization',
      'recency': 'Recent content first - best for news and current events',
      'relevance': 'Query-matched content first - best for targeted summarization',
      'engagement': 'High-quality content first - best for premium content',
      'duration': 'Optimal length content first - best for efficient processing'
    };

    console.log('\n🎛️  Available Summarization Strategies:\n');

    Object.entries(strategies).forEach(([strategy, description]) => {
      console.log(`📈 ${strategy.toUpperCase()}:`);
      console.log(`   Description: ${description}`);
      
      // Show typical use cases
      let useCases = [];
      switch (strategy) {
        case 'hybrid':
          useCases = ['General podcast summarization', 'Mixed content types', 'Balanced resource usage'];
          break;
        case 'recency':
          useCases = ['News podcasts', 'Current events', 'Time-sensitive content'];
          break;
        case 'relevance':
          useCases = ['Topic-specific summarization', 'Research projects', 'Targeted content analysis'];
          break;
        case 'engagement':
          useCases = ['Premium content', 'Popular episodes', 'High-production content'];
          break;
        case 'duration':
          useCases = ['Batch processing optimization', 'Resource-constrained environments', 'Efficient workflows'];
          break;
      }
      
      console.log(`   Best for: ${useCases.join(', ')}`);
      console.log('');
    });

    // Show example API calls for each strategy
    console.log('💡 Example API Usage:\n');

    console.log('🔍 Create summarization queue with recency priority:');
    console.log(`POST ${this.baseUrl}/summary/queue`);
    console.log(JSON.stringify({
      feedUrl: "https://podcast-feed.com/rss",
      strategy: "recency",
      query: "breaking news update",
      maxQueueSize: 15
    }, null, 2));

    console.log('\n📝 Batch summarize with relevance priority:');
    console.log(`POST ${this.baseUrl}/summary/batch-episodes`);
    console.log(JSON.stringify({
      feedUrl: "https://podcast-feed.com/rss",
      maxEpisodes: 5,
      rankingStrategy: "relevance",
      query: "interview technology AI",
      summaryType: "comprehensive",
      processHighPriorityOnly: false
    }, null, 2));
  }

  /**
   * Show complete workflow integration
   */
  async showCompleteWorkflow() {
    console.log('\n🔄 Complete Intelligent Summarization Workflow:');
    console.log('-' .repeat(40));

    console.log(`
1️⃣  SEARCH & DISCOVERY (with podcast reranking)
   POST /api/search
   → Find relevant podcasts using intelligent ranking
   → Get feed URLs for further processing

2️⃣  EPISODE ANALYSIS (with episode reranking)  
   POST /api/episodes/for-processing
   → Analyze all episodes in podcast feed
   → Apply intelligent ranking for processing priority
   → Get processing recommendations

3️⃣  QUEUE PLANNING (intelligent summarization queue)
   POST /api/summary/queue
   → Create prioritized summarization queue
   → Estimate processing times and resource needs
   → Organize episodes by priority levels

4️⃣  BATCH PROCESSING (intelligent batch summarization)
   POST /api/summary/batch-episodes
   → Process episodes in priority order
   → Generate summaries for high-value content first
   → Track processing statistics and errors

5️⃣  MONITORING & OPTIMIZATION
   → Review processing results and priority effectiveness
   → Adjust strategies based on content types and goals
   → Scale processing based on queue priorities

💡 Key Benefits:
   ✅ Process high-value content first
   ✅ Optimize resource utilization
   ✅ Reduce processing time for important episodes
   ✅ Skip low-value or problematic content
   ✅ Track and improve processing effectiveness
    `);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const demo = new IntelligentSummarizationDemo();
  
  (async () => {
    console.log('🚀 Starting Intelligent Summarization Demo...\n');
    console.log('Make sure your server is running at http://localhost:3001\n');

    await demo.demonstrateIntelligentSummarization();
    await demo.showCompleteWorkflow();
    
    console.log('\n🎉 Demo completed!');
    console.log('\n🧠 The Intelligent Summarization System provides:');
    console.log('✅ Episode prioritization before processing');
    console.log('✅ Resource optimization through smart queuing');  
    console.log('✅ Multiple ranking strategies for different use cases');
    console.log('✅ Batch processing with priority-based scheduling');
    console.log('✅ Processing time estimation and planning');
    console.log('✅ Error handling and recommendations for next actions');
    console.log('✅ Complete integration with podcast search reranking');
    
    console.log('\n🎯 Perfect for:');
    console.log('📺 News podcasts (recency strategy)');
    console.log('🎤 Interview shows (relevance strategy)'); 
    console.log('📚 Educational content (engagement strategy)');
    console.log('⚡ Quick summaries (duration strategy)');
    console.log('🧠 Mixed content (hybrid strategy)');
  })();
}

module.exports = IntelligentSummarizationDemo;
