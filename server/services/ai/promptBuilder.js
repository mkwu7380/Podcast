/**
 * Prompt Engineering and Template Management Module
 * Handles all prompt construction for different summary types
 */

class PromptBuilder {
  constructor() {
    this.systemPrompt = 'You are an expert podcast summarizer. Create clear, structured summaries that capture key insights and main points.';
    this.maxTranscriptLength = 8000; // Character limit for transcript processing
  }

  /**
   * Build appropriate prompt based on summary type
   * @param {string} transcript - The transcript text
   * @param {string} type - Summary type (brief, detailed, bullet-points, comprehensive)
   * @param {string} customPrompt - Optional custom prompt override
   * @returns {string} Complete prompt for AI processing
   */
  buildSummaryPrompt(transcript, type = 'comprehensive', customPrompt = null) {
    if (customPrompt) {
      return `${this.systemPrompt}\n\n${customPrompt}`;
    }

    const truncatedTranscript = this.truncateTranscript(transcript);
    const basePrompt = `Please summarize the following podcast transcript:\n\n${truncatedTranscript}`;
    
    switch (type) {
      case 'brief':
        return this.buildBriefPrompt(basePrompt);
      
      case 'detailed':
        return this.buildDetailedPrompt(basePrompt);
      
      case 'bullet-points':
        return this.buildBulletPointsPrompt(basePrompt);
      
      case 'focused':
        return this.buildFocusedPrompt(basePrompt);
        
      default: // comprehensive
        return this.buildComprehensivePrompt(basePrompt);
    }
  }

  /**
   * Build episode-specific prompts for different sections
   * @param {string} section - Section type (overview, keyPoints, topics, quotes, actionItems)
   * @param {string} transcript - Episode transcript
   * @returns {string} Section-specific prompt
   */
  buildEpisodePrompt(section, transcript) {
    const truncatedTranscript = this.truncateTranscript(transcript, 4000);
    
    const prompts = {
      overview: `Provide a 2-3 sentence overview of this podcast episode: ${truncatedTranscript}`,
      keyPoints: `List the 5-7 most important points or insights discussed in this episode: ${truncatedTranscript}`,
      topics: `Identify the main topics and themes covered in this episode: ${truncatedTranscript}`,
      quotes: `Extract 2-3 most impactful or memorable quotes from this episode: ${truncatedTranscript}`,
      actionItems: `Identify any actionable advice or recommendations mentioned in this episode: ${truncatedTranscript}`
    };

    return `${this.systemPrompt}\n\n${prompts[section] || prompts.overview}`;
  }

  /**
   * Private helper methods for different prompt types
   */
  buildBriefPrompt(basePrompt) {
    return `${this.systemPrompt}\n\n${basePrompt}\n\nProvide a brief 2-3 sentence summary focusing on the main topic and key takeaway.`;
  }

  buildDetailedPrompt(basePrompt) {
    return `${this.systemPrompt}\n\n${basePrompt}\n\nProvide a detailed summary including:\n- Main topics discussed\n- Key insights and conclusions\n- Important quotes or statements\n- Actionable advice mentioned`;
  }

  buildBulletPointsPrompt(basePrompt) {
    return `${this.systemPrompt}\n\n${basePrompt}\n\nProvide a bullet-point summary with:\n- Main topic\n- 5-7 key points discussed\n- Notable quotes\n- Conclusions or recommendations`;
  }

  buildFocusedPrompt(basePrompt) {
    return `${this.systemPrompt}\n\n${basePrompt}\n\nProvide a focused summary highlighting the most important aspects of this content.`;
  }

  buildComprehensivePrompt(basePrompt) {
    return `${this.systemPrompt}\n\n${basePrompt}\n\nProvide a comprehensive summary that captures the essence of this podcast episode, including main themes, key insights, and important takeaways.`;
  }

  /**
   * Truncate transcript to stay within limits
   * @param {string} transcript - Original transcript
   * @param {number} maxLength - Maximum character length (default: 8000)
   * @returns {string} Truncated transcript
   */
  truncateTranscript(transcript, maxLength = null) {
    const limit = maxLength || this.maxTranscriptLength;
    
    if (transcript.length <= limit) {
      return transcript;
    }
    
    return transcript.slice(0, limit) + '...';
  }

  /**
   * Validate transcript content
   * @param {string} transcript - Transcript to validate
   * @returns {boolean} Whether transcript is valid
   */
  isValidTranscript(transcript) {
    return transcript && 
           typeof transcript === 'string' && 
           transcript.trim().length > 0;
  }
}

module.exports = new PromptBuilder();
