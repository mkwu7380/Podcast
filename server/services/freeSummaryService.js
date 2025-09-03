/**
 * Free local summarization service - no API keys required
 * Uses extractive summarization techniques
 */
class FreeSummaryService {
  constructor() {
    // English stop words
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
      'had', 'what', 'said', 'each', 'which', 'she', 'do', 'how', 'their',
      'if', 'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some',
      'her', 'would', 'make', 'like', 'into', 'him', 'time', 'two', 'more',
      'very', 'when', 'come', 'may', 'say', 'come', 'could', 'now', 'than',
      'first', 'been', 'call', 'who', 'oil', 'its', 'now', 'find', 'long',
      'down', 'day', 'did', 'get', 'has', 'him', 'his', 'how', 'man', 'new',
      'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put',
      'say', 'she', 'too', 'use'
    ]);

    // Chinese stop words (Simplified & Traditional Chinese particles and function words)
    this.chineseStopWords = new Set([
      // Simplified Chinese
      '的', '了', '和', '是', '在', '我', '有', '他', '这', '个', '上', '们', '来', '到',
      '时', '大', '地', '为', '子', '中', '你', '说', '生', '国', '年', '着', '就', '那',
      '和', '要', '她', '出', '也', '得', '里', '后', '自', '以', '会', '家', '可', '下',
      '而', '过', '天', '去', '能', '对', '小', '多', '然', '于', '心', '学', '么', '之',
      '都', '好', '看', '起', '发', '当', '没', '成', '只', '如', '事', '把', '还', '用',
      '第', '样', '道', '想', '作', '种', '开', '美', '乐', '者', '因', '又', '由', '做',
      '被', '从', '前', '但', '很', '更', '等', '嗯', '啊', '哦', '呃', '哈', '呀', '哇',
      
      // Traditional Chinese
      '的', '了', '和', '是', '在', '我', '有', '他', '這', '個', '上', '們', '來', '到',
      '時', '大', '地', '為', '子', '中', '你', '說', '生', '國', '年', '著', '就', '那',
      '要', '她', '出', '也', '得', '裡', '後', '自', '以', '會', '家', '可', '下', '而',
      '過', '天', '去', '能', '對', '小', '多', '然', '於', '心', '學', '麼', '之', '都',
      '好', '看', '起', '發', '當', '沒', '成', '只', '如', '事', '把', '還', '用', '第',
      '樣', '道', '想', '作', '種', '開', '美', '樂', '者', '因', '又', '由', '做', '被',
      '從', '前', '但', '很', '更', '等', '嗯', '啊', '哦', '呃', '哈', '呀', '哇', '與'
    ]);

    // Advertisement keywords (Simplified & Traditional Chinese and English)
    this.adKeywords = new Set([
      // Simplified Chinese ad keywords
      '广告', '赞助', '推广', '优惠', '折扣', '促销', '特价', '限时', '抢购', '秒杀',
      '专卖', '代理', '招商', '加盟', '投资', '理财', '贷款', '保险', '医疗', '减肥',
      '美容', '整形', '药品', '保健品', '营养品', '补品', '治疗', '偏方', '秘方',
      '赚钱', '致富', '发财', '暴富', '兼职', '刷单', '返利', '红包', '现金', '奖金',
      '免费领取', '限量', '包邮', '官网', '正品', '授权', '专柜', '直销', '微商',
      '淘宝', '京东', '拼多多', '天猫', '唯品会', '苏宁', '国美', '当当', '亚马逊',
      
      // Traditional Chinese ad keywords
      '廣告', '贊助', '推廣', '優惠', '折扣', '促銷', '特價', '限時', '搶購', '秒殺',
      '專賣', '代理', '招商', '加盟', '投資', '理財', '貸款', '保險', '醫療', '減肥',
      '美容', '整形', '藥品', '保健品', '營養品', '補品', '治療', '偏方', '祕方',
      '賺錢', '致富', '發財', '暴富', '兼職', '刷單', '返利', '紅包', '現金', '獎金',
      '免費領取', '限量', '包郵', '官網', '正品', '授權', '專櫃', '直銷', '微商',
      '淘寶', '京東', '拼多多', '天貓', '唯品會', '蘇寧', '國美', '當當', '亞馬遜',
      
      // English ad keywords  
      'advertisement', 'sponsored', 'promotion', 'discount', 'sale', 'offer', 'deal',
      'limited time', 'special price', 'buy now', 'click here', 'visit', 'website',
      'subscribe', 'follow us', 'like and share', 'download', 'app', 'free trial',
      'premium', 'upgrade', 'purchase', 'order', 'checkout', 'payment', 'credit card',
      'affiliate', 'commission', 'referral', 'bonus', 'reward', 'cashback', 'coupon'
    ]);

    // Common ad transition phrases (Simplified & Traditional Chinese)
    this.adTransitions = new Set([
      // Simplified Chinese
      '接下来', '现在', '今天', '为您推荐', '特别推荐', '友情提醒', '温馨提示',
      '顺便说一下', '对了', '话说回来', '说到这里', '提到这个', '另外',
      
      // Traditional Chinese
      '接下來', '現在', '今天', '為您推薦', '特別推薦', '友情提醒', '溫馨提示',
      '順便說一下', '對了', '話說回來', '說到這裡', '提到這個', '另外',
      
      // English
      'speaking of', 'by the way', 'while we\'re on the topic', 'now', 'today',
      'i want to tell you about', 'let me tell you about', 'check out'
    ]);
  }

  /**
   * Generate a summary using extractive techniques
   * @param {string} text - Text to summarize
   * @param {Object} options - Summary options
   * @returns {Object} Summary result
   */
  async generateSummary(text, options = {}) {
    const { type = 'comprehensive', maxSentences = 5 } = options;
    
    try {
      // First, restore punctuation to improve sentence quality
      const improvedText = this.restorePunctuation(text);
      
      // Clean and split text into sentences
      const sentences = this.extractSentences(improvedText);
      if (sentences.length === 0) {
        throw new Error('No sentences found in text');
      }

      // Score sentences based on word frequency and position
      const scoredSentences = this.scoreSentences(sentences, text);
      
      // Select top sentences based on type
      const summaryLength = this.getSummaryLength(type, sentences.length);
      const topSentences = scoredSentences
        .slice(0, summaryLength)
        .sort((a, b) => a.originalIndex - b.originalIndex)
        .map(item => item.sentence);

      const summaryText = topSentences.join(' ');
      
      return {
        summary: summaryText,
        type: type,
        method: 'extractive',
        originalLength: text.length,
        summaryLength: summaryText.length,
        compressionRatio: ((text.length - summaryText.length) / text.length * 100).toFixed(1) + '%',
        sentences: topSentences.length,
        model: 'free-local-summarizer'
      };
    } catch (error) {
      console.error('Free summarization error:', error);
      throw new Error(`Summarization failed: ${error.message}`);
    }
  }

  /**
   * Generate structured episode summary
   * @param {string} transcript - Episode transcript
   * @param {Object} episodeInfo - Episode metadata
   * @returns {Object} Structured summary
   */
  async generateEpisodeSummary(transcript, episodeInfo = {}) {
    try {
      // First, restore punctuation to improve sentence quality
      const improvedTranscript = this.restorePunctuation(transcript);
      
      const sentences = this.extractSentences(improvedTranscript);
      const scoredSentences = this.scoreSentences(sentences, improvedTranscript);
      
      // Extract different sections
      const overview = this.extractOverview(scoredSentences.slice(0, 3));
      const keyPoints = this.extractKeyPoints(scoredSentences.slice(0, 8));
      const topics = this.extractTopics(transcript);
      
      return {
        overview,
        keyPoints,
        topics,
        type: 'episode',
        method: 'extractive-structured',
        episodeInfo,
        model: 'free-local-summarizer',
        wordCount: transcript.split(' ').length
      };
    } catch (error) {
      console.error('Episode summarization error:', error);
      throw new Error(`Episode summarization failed: ${error.message}`);
    }
  }

  /**
   * Restore punctuation to improve transcript quality
   * @param {string} text - Raw transcript text
   * @returns {string} Text with improved punctuation
   */
  restorePunctuation(text) {
    if (!text || text.length === 0) return text;
    
    // Clean up the text first
    let improvedText = text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    // Add periods after common sentence endings (English)
    improvedText = improvedText
      // Add periods after statements that end without punctuation
      .replace(/([a-z])\s+([A-Z][a-z])/g, '$1. $2')
      // Add periods after numbers followed by capital letters
      .replace(/(\d)\s+([A-Z][a-z])/g, '$1. $2')
      // Fix common pause patterns
      .replace(/\b(so|and|but|however|therefore|meanwhile)\s+([A-Z])/g, '$1, $2')
      // Add commas after transition words
      .replace(/\b(first|second|third|next|then|finally|also|additionally)\s+([a-z])/g, '$1, $2');
    
    // Handle Chinese text punctuation
    improvedText = improvedText
      // Add Chinese periods after common endings
      .replace(/([\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff])\s+([\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff])/g, (match, p1, p2, offset, string) => {
        // Check if this looks like a sentence boundary (common ending characters)
        if (/[了的啊呢吧是就这那要会能可以]$/.test(p1)) {
          return p1 + '。 ' + p2;
        }
        return match;
      })
      // Add commas for Chinese transition words
      .replace(/\b(然后|接下来|另外|此外|而且|不过|但是|因此|所以)\s+/g, '$1，');
    
    // Fix spacing around punctuation
    improvedText = improvedText
      .replace(/\s*([.!?。！？,，])\s*/g, '$1 ')
      .replace(/\s+$/, '')
      .replace(/^\s+/, '');
    
    return improvedText;
  }

  /**
   * Extract sentences from text (supports Chinese and English)
   * @param {string} text - Input text
   * @returns {Array} Array of sentences
   */
  extractSentences(text) {
    // Handle Chinese punctuation and sentence boundaries (Simplified & Traditional)
    let sentences = text
      .replace(/([.!?。！？])\s*(?=[A-Z\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff])/g, '$1|')
      .replace(/([。！？])\s*/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => {
        if (s.length < 10) return false;
        
        // For Chinese text (Traditional & Simplified), check character count; for English, check word count
        const chineseChars = (s.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || []).length;
        const englishWords = s.split(/\s+/).filter(w => /[a-zA-Z]/.test(w)).length;
        
        return chineseChars > 5 || englishWords > 3;
      })
      .slice(0, 100); // Limit for performance

    // Filter out advertisement sentences
    sentences = this.filterAdvertisements(sentences);
    
    return sentences;
  }

  /**
   * Filter out advertisement content from sentences
   * @param {Array} sentences - Array of sentences
   * @returns {Array} Filtered sentences without ads
   */
  filterAdvertisements(sentences) {
    return sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      // Check for ad keywords
      const hasAdKeywords = Array.from(this.adKeywords).some(keyword => 
        lowerSentence.includes(keyword.toLowerCase())
      );
      
      // Check for ad transition phrases
      const hasAdTransitions = Array.from(this.adTransitions).some(phrase => 
        lowerSentence.includes(phrase.toLowerCase())
      );
      
      // Check for promotional patterns (URLs, phone numbers, prices)
      const hasPromotionalContent = 
        /https?:\/\//.test(sentence) || // URLs
        /\b\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/.test(sentence) || // Phone numbers
        /[¥$]\d+|价格|价钱|费用.*\d+|优惠价.*\d+/.test(sentence) || // Prices
        /微信|QQ|WeChat|联系方式|客服|咨询/.test(sentence); // Contact info
      
      // Check for excessive promotional language
      const promotionalWordCount = (sentence.match(/[免费|赠送|特价|优惠|折扣|促销|限时|抢购]/g) || []).length;
      const hasExcessivePromotion = promotionalWordCount > 2;
      
      // Filter out if any promotional criteria are met
      return !(hasAdKeywords || hasAdTransitions || hasPromotionalContent || hasExcessivePromotion);
    });
  }

  /**
   * Score sentences based on word frequency and position
   * @param {Array} sentences - Array of sentences
   * @param {string} fullText - Full text for context
   * @returns {Array} Scored sentences sorted by score
   */
  scoreSentences(sentences, fullText) {
    // Calculate word frequencies
    const wordFreq = this.calculateWordFrequency(fullText);
    
    return sentences.map((sentence, index) => {
      let score = 0;
      const words = sentence.toLowerCase().split(/\s+/)
        .filter(word => word.length > 2 && !this.stopWords.has(word));
      
      // Score based on word frequency
      words.forEach(word => {
        score += wordFreq[word] || 0;
      });
      
      // Normalize by sentence length
      score = score / Math.max(words.length, 1);
      
      // Boost score for sentences with numbers/statistics
      if (/\d+/.test(sentence)) score *= 1.2;
      
      // Boost score for sentences with key indicators
      const keyIndicators = ['important', 'key', 'main', 'significant', 'crucial', 'essential'];
      if (keyIndicators.some(indicator => sentence.toLowerCase().includes(indicator))) {
        score *= 1.3;
      }
      
      // Position bonus (early sentences often contain important info)
      if (index < sentences.length * 0.2) score *= 1.1;
      
      return {
        sentence,
        score,
        originalIndex: index
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate word frequency in text (supports Chinese and English)
   * @param {string} text - Input text
   * @returns {Object} Word frequency map
   */
  calculateWordFrequency(text) {
    const freq = {};
    
    // Process Chinese characters (Traditional & Simplified)
    const chineseChars = text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || [];
    chineseChars.forEach(char => {
      if (!this.chineseStopWords.has(char) && char.length > 0) {
        freq[char] = (freq[char] || 0) + 1;
      }
    });
    
    // Process Chinese words (2-4 characters, Traditional & Simplified)
    const chineseWords = text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]{2,4}/g) || [];
    chineseWords.forEach(word => {
      if (!this.chineseStopWords.has(word)) {
        freq[word] = (freq[word] || 0) + 2; // Give words higher weight than single chars
      }
    });
    
    // Process English words
    const englishWords = text.toLowerCase().split(/\s+/)
      .filter(word => /[a-zA-Z]/.test(word))
      .filter(word => word.length > 2 && !this.stopWords.has(word));
    
    englishWords.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    
    return freq;
  }

  /**
   * Determine summary length based on type
   * @param {string} type - Summary type
   * @param {number} totalSentences - Total number of sentences
   * @returns {number} Number of sentences to include
   */
  getSummaryLength(type, totalSentences) {
    const ratios = {
      'brief': 0.1,
      'comprehensive': 0.2,
      'detailed': 0.3,
      'bullet-points': 0.25
    };
    
    const ratio = ratios[type] || 0.2;
    return Math.min(Math.max(Math.floor(totalSentences * ratio), 2), 10);
  }

  /**
   * Extract overview from top sentences
   * @param {Array} topSentences - Top scored sentences
   * @returns {string} Overview text
   */
  extractOverview(topSentences) {
    const overview = topSentences
      .map(item => item.sentence.trim())
      .join(' ')
      .substring(0, 600);
    
    // Ensure it ends with proper punctuation
    const lastChar = overview.slice(-1);
    if (!/[.!?。！？]/.test(lastChar)) {
      return overview + '...';
    }
    return overview;
  }

  /**
   * Extract key points with better formatting
   * @param {Array} sentences - Scored sentences
   * @returns {string} Key points text
   */
  extractKeyPoints(sentences) {
    return sentences
      .slice(0, 6)
      .map((item, index) => {
        let sentence = item.sentence.trim();
        // Ensure sentence ends with punctuation
        const lastChar = sentence.slice(-1);
        if (!/[.!?。！？]/.test(lastChar)) {
          sentence += sentence.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/) ? '。' : '.';
        }
        return `${index + 1}. ${sentence}`;
      })
      .join('\n');
  }

  /**
   * Extract topics from text using keyword extraction
   * @param {string} text - Input text
   * @returns {string} Topics covered
   */
  extractTopics(text) {
    const words = text.toLowerCase().split(/\s+/)
      .filter(word => word.length > 4 && !this.stopWords.has(word));
    
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
    
    return `Main topics discussed: ${topWords.join(', ')}`;
  }

  /**
   * Check if AI service is configured
   * @returns {boolean} Always true for free service
   */
  isAiConfigured() {
    return true;
  }

  /**
   * Get AI provider status
   * @returns {Object} Provider status
   */
  getAIProviderStatus() {
    return {
      provider: 'Free Local Summarizer',
      status: 'active',
      apiKey: 'not-required',
      cost: 'free',
      limitations: 'Basic extractive summarization'
    };
  }
}

module.exports = new FreeSummaryService();
