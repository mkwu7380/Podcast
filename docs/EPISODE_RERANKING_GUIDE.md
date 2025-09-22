# Episode Reranking System Guide (剧集重排序指南)

## Overview

The Episode Reranking System is designed to intelligently prioritize podcast episodes **before** they enter the processing pipeline for transcription and summarization. This ensures that the most valuable content gets processed first, optimizing resource usage and improving user experience.

## Key Benefits

### 🎯 **Smart Processing Prioritization**
- Episodes are ranked by relevance, recency, engagement, and duration
- High-priority episodes get processed first
- Resource-intensive operations focus on valuable content

### ⚡ **Efficient Pipeline Management**
- Processing queues organize episodes by priority levels
- Batch processing optimized for different priority tiers
- Deferred processing for low-value content

### 📊 **Intelligent Scoring**
- Multi-factor scoring algorithm considers content quality
- User preferences and query relevance
- Duration optimization (avoids too short/long episodes)

## Episode Ranking Strategies

### 1. **Relevance Strategy** 🎯
```javascript
{
  "strategy": "relevance",
  "description": "Prioritizes episodes based on title/content relevance to search query"
}
```
**Best for:** Targeted content processing, specific topic analysis

### 2. **Recency Strategy** 🆕
```javascript
{
  "strategy": "recency",
  "description": "Prioritizes recently published episodes"
}
```
**Best for:** News podcasts, current events, trending topics

### 3. **Engagement Strategy** ⭐
```javascript
{
  "strategy": "engagement",
  "description": "Prioritizes episodes with high engagement indicators"
}
```
**Best for:** Popular content, high-quality production values

### 4. **Duration Strategy** ⏱️
```javascript
{
  "strategy": "duration",
  "description": "Prioritizes episodes with optimal length (15min-2hrs)"
}
```
**Best for:** Balanced content consumption, processing efficiency

### 5. **Hybrid Strategy** 🧠 *(Default)*
```javascript
{
  "strategy": "hybrid",
  "weights": {
    "relevance": 0.35,
    "recency": 0.3,
    "engagement": 0.2,
    "duration": 0.15
  }
}
```
**Best for:** General use, balanced optimization

## API Usage Examples

### Basic Episode Reranking

```javascript
POST /api/episodes
{
  "feedUrl": "https://podcast.example.com/rss",
  "enableEpisodeReranking": true,
  "episodeRankingStrategy": "hybrid",
  "prioritizeForProcessing": true,
  "limit": 20
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "episodes": [
      {
        "title": "Episode Title",
        "_processingPriority": {
          "rank": 1,
          "priority": "high",
          "finalScore": 0.87,
          "scheduledAt": "2024-01-15T10:30:00Z"
        },
        "_scores": {
          "relevance": 0.92,
          "recency": 0.85,
          "engagement": 0.78,
          "duration": 0.95,
          "final": 0.87
        }
      }
    ],
    "episodeReranking": {
      "enabled": true,
      "strategy": "hybrid",
      "applied": true,
      "prioritizedForProcessing": true
    }
  }
}
```

### Processing-Optimized Episode Selection

```javascript
POST /api/episodes/for-processing
{
  "feedUrl": "https://podcast.example.com/rss",
  "maxEpisodes": 10,
  "strategy": "hybrid",
  "query": "interview technology",
  "userPreferences": {
    "min": 900,      // 15 minutes
    "optimal": 2700, // 45 minutes  
    "max": 7200      // 2 hours
  }
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "episodes": [...], // Top 10 episodes for processing
    "processingQueues": {
      "high": 8,      // Process immediately
      "medium": 15,   // Process next
      "low": 12,      // Process when resources available
      "deferred": 5   // Process last or skip
    },
    "totalEpisodes": 40,
    "strategy": "hybrid",
    "optimizedForProcessing": true,
    "recommendations": {
      "processFirst": [
        {
          "title": "Tech Innovation Interview",
          "score": 0.94,
          "reason": "Very recent, Highly relevant, Optimal duration"
        }
      ]
    }
  }
}
```

## Processing Pipeline Integration

### Step 1: Episode Discovery and Ranking
```javascript
// Get processing-optimized episodes
const episodesResponse = await fetch('/api/episodes/for-processing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    feedUrl: podcastFeedUrl,
    maxEpisodes: 20,
    strategy: 'hybrid',
    query: userSearchQuery
  })
});

const { episodes, processingQueues } = episodesResponse.data;
```

### Step 2: Priority-Based Processing
```javascript
// Process high-priority episodes first
const highPriorityEpisodes = episodes.filter(
  ep => ep._processingPriority?.priority === 'high'
);

for (const episode of highPriorityEpisodes) {
  await processEpisode(episode);
}
```

### Step 3: Batch Processing by Priority
```javascript
// Process medium priority in batches
const mediumPriorityEpisodes = episodes.filter(
  ep => ep._processingPriority?.priority === 'medium'
);

// Process in smaller batches to manage resources
const batchSize = 5;
for (let i = 0; i < mediumPriorityEpisodes.length; i += batchSize) {
  const batch = mediumPriorityEpisodes.slice(i, i + batchSize);
  await Promise.all(batch.map(processEpisode));
}
```

## Scoring Algorithm Details

### Relevance Score (0-1)
- **Query Matching**: Title and content keyword matching
- **Word Overlap**: Semantic similarity between query and episode
- **Content Quality**: Metadata completeness, description length
- **Topic Keywords**: Bonus for high-value terms (interview, analysis, etc.)

### Recency Score (0-1)
- **Publication Date**: Exponential decay with 30-day half-life
- **Formula**: `Math.exp(-daysSincePublished / 30)`
- **Recent Bonus**: Episodes published within last week get boosted

### Engagement Score (0-1)
- **File Size**: Indicates production quality (20MB-200MB optimal)
- **Artwork**: Presence indicates professional production
- **Episode Metadata**: Complete iTunes tags and descriptions
- **Series Position**: Early episodes in series get slight bonus

### Duration Score (0-1)
- **Optimal Range**: 15 minutes to 2 hours
- **Sweet Spot**: 45 minutes gets highest score
- **Penalties**: Very short (<15min) or very long (>2hrs) content
- **User Preferences**: Customizable duration preferences

## Configuration Options

### Environment Variables
```bash
# Episode reranking settings
EPISODE_RERANK_ENABLED=true
EPISODE_RERANK_DEFAULT_STRATEGY=hybrid
EPISODE_RERANK_TIMEOUT_MS=3000

# Duration preferences (seconds)
EPISODE_MIN_DURATION=900     # 15 minutes
EPISODE_OPTIMAL_DURATION=2700 # 45 minutes
EPISODE_MAX_DURATION=7200    # 2 hours

# Processing queue sizes
EPISODE_HIGH_PRIORITY_LIMIT=10
EPISODE_MEDIUM_PRIORITY_LIMIT=20
```

### Custom Weight Configuration
```javascript
const customWeights = {
  relevance: 0.5,  // Increase relevance importance
  recency: 0.2,    // Decrease recency importance
  engagement: 0.2,
  duration: 0.1
};

const episodes = await episodeRerankingService.rerankEpisodes(
  rawEpisodes,
  { 
    strategy: 'hybrid', 
    weights: customWeights 
  }
);
```

## Performance Optimization

### Processing Recommendations

1. **High Priority First**: Always process high-priority episodes immediately
2. **Batch Medium Priority**: Process medium priority in small batches
3. **Background Low Priority**: Process low priority during off-peak hours
4. **Skip Deferred**: Consider skipping deferred episodes entirely

### Resource Management

```javascript
// Example processing scheduler
class EpisodeProcessor {
  async processWithPriority(episodes) {
    // Immediate processing
    const high = episodes.filter(ep => ep._processingPriority?.priority === 'high');
    await this.processImmediately(high);
    
    // Scheduled processing
    const medium = episodes.filter(ep => ep._processingPriority?.priority === 'medium');
    await this.scheduleProcessing(medium, { delay: 0, batchSize: 5 });
    
    // Background processing
    const low = episodes.filter(ep => ep._processingPriority?.priority === 'low');
    await this.scheduleProcessing(low, { delay: 3600000, batchSize: 10 }); // 1 hour delay
  }
}
```

## Testing and Validation

### Unit Tests
```javascript
// Test individual scoring components
describe('Episode Reranking Service', () => {
  it('should calculate relevance score correctly', () => {
    const episode = { title: 'Tech Interview with AI Expert' };
    const score = service.calculateRelevanceScore(episode, 'AI technology');
    expect(score).toBeGreaterThan(0.7);
  });

  it('should prioritize recent episodes', () => {
    const recentEpisode = { pubDate: new Date().toISOString() };
    const oldEpisode = { pubDate: '2020-01-01T00:00:00Z' };
    
    const recentScore = service.calculateRecencyScore(recentEpisode);
    const oldScore = service.calculateRecencyScore(oldEpisode);
    
    expect(recentScore).toBeGreaterThan(oldScore);
  });
});
```

### Integration Tests
```javascript
// Test full reranking pipeline
describe('Episode Processing Pipeline', () => {
  it('should rerank episodes for processing', async () => {
    const episodes = await service.rerankEpisodes(mockEpisodes, {
      strategy: 'hybrid',
      query: 'technology interview'
    });

    expect(episodes[0]._processingPriority.priority).toBe('high');
    expect(episodes[0]._scores.final).toBeGreaterThan(episodes[1]._scores.final);
  });
});
```

## Troubleshooting

### Common Issues

**Episodes Not Being Reranked**
- Check `enableEpisodeReranking: true` in request
- Verify episode count > 1 (single episodes aren't reranked)
- Check server logs for processing errors

**Poor Episode Selection**
- Adjust strategy weights for your use case
- Try different ranking strategies
- Verify episode metadata quality in RSS feed

**Performance Issues**
- Reduce batch sizes in configuration
- Lower timeout values for faster fallback
- Cache scoring results for repeated episodes

### Debug Mode

Enable detailed episode scoring logs:
```bash
NODE_ENV=development EPISODE_RERANK_LOG_SCORES=true npm start
```

This will output detailed scoring information for each episode to help debug ranking issues.

## Best Practices

### 1. **Choose Appropriate Strategy**
- Use **hybrid** for general-purpose processing
- Use **recency** for news/current events podcasts
- Use **relevance** when processing specific topics
- Use **engagement** for quality-focused processing

### 2. **Optimize Processing Queues**
- Process high-priority episodes immediately
- Batch process medium-priority episodes
- Schedule low-priority processing during off-peak hours
- Consider skipping deferred episodes

### 3. **Monitor Performance**
- Track processing completion rates by priority
- Monitor scoring distribution across episodes
- Adjust weights based on user feedback and engagement

### 4. **User Personalization**
- Collect user preferences for duration
- Track user engagement with processed content
- Adjust ranking weights based on user behavior

---

The Episode Reranking System ensures that your podcast processing pipeline focuses on the most valuable content first, improving efficiency and user satisfaction while optimizing resource utilization.
