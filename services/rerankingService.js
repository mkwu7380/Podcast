/**
 * Advanced Reranking Service for Podcast Search Optimization
 * 重排序模型 - Implements multiple ranking strategies to optimize search results
 */

class RerankingService {
  constructor() {
    // Reranking strategies and their weights
    this.strategies = {
      SEMANTIC: 'semantic',        // Based on text similarity
      POPULARITY: 'popularity',     // Based on ratings and track count
      RECENCY: 'recency',          // Based on release date
      HYBRID: 'hybrid'             // Combined approach
    };

    // Default weights for hybrid ranking
    this.defaultWeights = {
      semantic: 0.4,
      popularity: 0.35,
      recency: 0.25
    };
  }

  /**
   * Main reranking function - orchestrates the reranking process
   * @param {Array} podcasts - Array of podcast results from iTunes API
   * @param {string} query - Original search query
   * @param {Object} options - Reranking configuration
   * @returns {Array} Reranked podcast results
   */
  async rerank(podcasts, query, options = {}) {
    if (!podcasts || podcasts.length === 0) {
      return podcasts;
    }

    const strategy = options.strategy || this.strategies.HYBRID;
    const weights = { ...this.defaultWeights, ...options.weights };

    console.log(`🔄 Reranking ${podcasts.length} podcasts using ${strategy} strategy`);

    try {
      // Add base scores to all podcasts
      const podcastsWithScores = await this.calculateBaseScores(podcasts, query);

      let rerankedPodcasts;
      switch (strategy) {
        case this.strategies.SEMANTIC:
          rerankedPodcasts = this.rankBySemantic(podcastsWithScores);
          break;
        case this.strategies.POPULARITY:
          rerankedPodcasts = this.rankByPopularity(podcastsWithScores);
          break;
        case this.strategies.RECENCY:
          rerankedPodcasts = this.rankByRecency(podcastsWithScores);
          break;
        case this.strategies.HYBRID:
        default:
          rerankedPodcasts = this.rankByHybrid(podcastsWithScores, weights);
          break;
      }

      // Add ranking metadata
      rerankedPodcasts.forEach((podcast, index) => {
        podcast._ranking = {
          position: index + 1,
          strategy: strategy,
          finalScore: podcast._scores?.final || 0,
          appliedAt: new Date().toISOString()
        };
      });

      console.log(`✅ Reranking completed. Top result: "${rerankedPodcasts[0]?.collectionName}"`);
      return rerankedPodcasts;

    } catch (error) {
      console.error('❌ Reranking failed, returning original order:', error.message);
      return podcasts;
    }
  }

  /**
   * Calculate base scores for all ranking factors
   * @param {Array} podcasts - Podcast results
   * @param {string} query - Search query
   * @returns {Array} Podcasts with calculated scores
   */
  async calculateBaseScores(podcasts, query) {
    return podcasts.map(podcast => {
      const semanticScore = this.calculateSemanticScore(podcast, query);
      const popularityScore = this.calculatePopularityScore(podcast);
      const recencyScore = this.calculateRecencyScore(podcast);

      return {
        ...podcast,
        _scores: {
          semantic: semanticScore,
          popularity: popularityScore,
          recency: recencyScore,
          final: 0 // Will be calculated based on strategy
        }
      };
    });
  }

  /**
   * Calculate semantic similarity score between query and podcast metadata
   * Uses multiple text similarity algorithms
   * @param {Object} podcast - Podcast object
   * @param {string} query - Search query
   * @returns {number} Semantic similarity score (0-1)
   */
  calculateSemanticScore(podcast, query) {
    if (!query || !podcast) return 0;

    const queryLower = query.toLowerCase().trim();
    const title = (podcast.collectionName || '').toLowerCase();
    const artist = (podcast.artistName || '').toLowerCase();
    const description = ((podcast.description || '') + ' ' + (podcast.longDescription || '')).toLowerCase();

    // 1. Exact match bonus
    let exactMatchScore = 0;
    if (title.includes(queryLower)) exactMatchScore += 0.8;
    if (artist.includes(queryLower)) exactMatchScore += 0.6;
    if (description.includes(queryLower)) exactMatchScore += 0.4;

    // 2. Jaccard similarity for title
    const titleJaccard = this.calculateJaccardSimilarity(queryLower, title);
    
    // 3. N-gram similarity
    const ngramScore = this.calculateNgramSimilarity(queryLower, title);

    // 4. Fuzzy matching score
    const fuzzyScore = this.calculateFuzzyScore(queryLower, title);

    // Combine scores with weights
    const semanticScore = Math.min(1, (
      exactMatchScore * 0.4 +
      titleJaccard * 0.25 +
      ngramScore * 0.2 +
      fuzzyScore * 0.15
    ));

    return semanticScore;
  }

  /**
   * Calculate popularity score based on iTunes metrics
   * @param {Object} podcast - Podcast object
   * @returns {number} Popularity score (0-1)
   */
  calculatePopularityScore(podcast) {
    let score = 0;

    // Track count indicates content volume
    const trackCount = podcast.trackCount || 0;
    const trackScore = Math.min(1, trackCount / 1000); // Normalize to 1000 episodes max
    score += trackScore * 0.3;

    // Content rating indicates quality/appropriateness
    if (podcast.contentAdvisoryRating) {
      score += 0.2; // Bonus for having rating info
    }

    // Genre information indicates categorization
    const hasGenre = podcast.primaryGenreName || podcast.genres;
    if (hasGenre) {
      score += 0.2;
    }

    // Collection type preference
    if (podcast.wrapperType === 'track') {
      score += 0.1; // Slight preference for complete collections
    }

    // Artwork quality (indicates professional production)
    if (podcast.artworkUrl600 || podcast.artworkUrl100) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * Calculate recency score based on release date
   * @param {Object} podcast - Podcast object  
   * @returns {number} Recency score (0-1)
   */
  calculateRecencyScore(podcast) {
    if (!podcast.releaseDate) return 0.3; // Default score for unknown dates

    const releaseDate = new Date(podcast.releaseDate);
    const now = new Date();
    const daysSinceRelease = Math.abs(now - releaseDate) / (1000 * 60 * 60 * 24);

    // Exponential decay function - more recent content gets higher scores
    // Score approaches 0 after 3 years (1095 days)
    const recencyScore = Math.exp(-daysSinceRelease / 365); // 1-year half-life

    return Math.min(1, Math.max(0, recencyScore));
  }

  /**
   * Jaccard similarity coefficient
   * @param {string} str1 - First string
   * @param {string} str2 - Second string  
   * @returns {number} Jaccard similarity (0-1)
   */
  calculateJaccardSimilarity(str1, str2) {
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * N-gram similarity calculation
   * @param {string} query - Search query
   * @param {string} text - Text to compare
   * @returns {number} N-gram similarity score (0-1)
   */
  calculateNgramSimilarity(query, text, n = 2) {
    if (!query || !text) return 0;

    const getNgrams = (str, size) => {
      const ngrams = [];
      for (let i = 0; i <= str.length - size; i++) {
        ngrams.push(str.slice(i, i + size));
      }
      return ngrams;
    };

    const queryNgrams = getNgrams(query.replace(/\s+/g, ''), n);
    const textNgrams = getNgrams(text.replace(/\s+/g, ''), n);
    
    if (queryNgrams.length === 0 || textNgrams.length === 0) return 0;

    const querySet = new Set(queryNgrams);
    const textSet = new Set(textNgrams);
    const intersection = new Set([...querySet].filter(x => textSet.has(x)));
    
    return intersection.size / Math.max(querySet.size, textSet.size);
  }

  /**
   * Simple fuzzy matching score using Levenshtein-inspired logic
   * @param {string} query - Search query
   * @param {string} text - Text to compare
   * @returns {number} Fuzzy similarity score (0-1)
   */
  calculateFuzzyScore(query, text) {
    if (!query || !text) return 0;
    
    const distance = this.levenshteinDistance(query, text);
    const maxLength = Math.max(query.length, text.length);
    
    return maxLength === 0 ? 0 : 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Rank by semantic similarity only
   * @param {Array} podcasts - Podcasts with scores
   * @returns {Array} Sorted podcasts
   */
  rankBySemantic(podcasts) {
    return podcasts
      .map(p => ({ ...p, _scores: { ...p._scores, final: p._scores.semantic } }))
      .sort((a, b) => b._scores.final - a._scores.final);
  }

  /**
   * Rank by popularity only
   * @param {Array} podcasts - Podcasts with scores
   * @returns {Array} Sorted podcasts
   */
  rankByPopularity(podcasts) {
    return podcasts
      .map(p => ({ ...p, _scores: { ...p._scores, final: p._scores.popularity } }))
      .sort((a, b) => b._scores.final - a._scores.final);
  }

  /**
   * Rank by recency only
   * @param {Array} podcasts - Podcasts with scores  
   * @returns {Array} Sorted podcasts
   */
  rankByRecency(podcasts) {
    return podcasts
      .map(p => ({ ...p, _scores: { ...p._scores, final: p._scores.recency } }))
      .sort((a, b) => b._scores.final - a._scores.final);
  }

  /**
   * Hybrid ranking using weighted combination of all factors
   * @param {Array} podcasts - Podcasts with scores
   * @param {Object} weights - Weights for each factor
   * @returns {Array} Sorted podcasts
   */
  rankByHybrid(podcasts, weights) {
    return podcasts
      .map(podcast => {
        const finalScore = (
          podcast._scores.semantic * weights.semantic +
          podcast._scores.popularity * weights.popularity +
          podcast._scores.recency * weights.recency
        );
        
        return {
          ...podcast,
          _scores: { ...podcast._scores, final: finalScore }
        };
      })
      .sort((a, b) => b._scores.final - a._scores.final);
  }

  /**
   * Get available reranking strategies
   * @returns {Object} Available strategies
   */
  getAvailableStrategies() {
    return { ...this.strategies };
  }

  /**
   * Update default weights for hybrid ranking
   * @param {Object} newWeights - New weight configuration
   */
  updateWeights(newWeights) {
    this.defaultWeights = { ...this.defaultWeights, ...newWeights };
  }
}

module.exports = new RerankingService();
