/**
 * Status & Health Management Module
 * Handles service status monitoring, health checks, and configuration validation
 */

const aiConfig = require('./config');
const modelManager = require('./modelManager');

class StatusManager {
  /**
   * Check if AI services are properly configured
   * @returns {boolean} Configuration status
   */
  isAiConfigured() {
    return aiConfig.isGeminiConfigured();
  }

  /**
   * Get comprehensive AI provider status
   * @returns {Object} Detailed provider status information
   */
  getAIProviderStatus() {
    const apiKeys = aiConfig.getAPIKeys();
    const modelStatus = modelManager.getModelStatus();
    
    return {
      provider: 'Google Gemini',
      defaultModel: aiConfig.getDefaultModel(),
      availableModels: Object.keys(aiConfig.getAvailableModels()),
      modelDetails: aiConfig.getAvailableModels(),
      modelStatus: modelStatus,
      configured: this.isAiConfigured(),
      apiKeySet: !!apiKeys.gemini,
      healthCheck: this.getHealthStatus(),
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Perform health check on AI services
   * @returns {Object} Health status
   */
  getHealthStatus() {
    const issues = [];
    const warnings = [];
    
    // Check API configuration
    if (!aiConfig.isGeminiConfigured()) {
      issues.push('Gemini API key not configured');
    }
    
    // Check model availability
    const modelStatus = modelManager.getModelStatus();
    const unavailableModels = Object.entries(modelStatus)
      .filter(([, status]) => !status.available)
      .map(([name]) => name);
      
    if (unavailableModels.length > 0) {
      warnings.push(`Models unavailable: ${unavailableModels.join(', ')}`);
    }
    
    // Check default model
    const defaultModel = aiConfig.getDefaultModel();
    const defaultModelStatus = modelManager.validateModel(defaultModel);
    if (!defaultModelStatus.available) {
      issues.push(`Default model ${defaultModel} is not available`);
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'unhealthy',
      issues: issues.length > 0 ? issues : null,
      warnings: warnings.length > 0 ? warnings : null,
      score: this.calculateHealthScore(issues.length, warnings.length),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate overall health score
   * @param {number} issuesCount - Number of critical issues
   * @param {number} warningsCount - Number of warnings
   * @returns {number} Health score (0-100)
   */
  calculateHealthScore(issuesCount, warningsCount) {
    const baseScore = 100;
    const issuePenalty = issuesCount * 30; // Critical issues have high penalty
    const warningPenalty = warningsCount * 10; // Warnings have lower penalty
    
    return Math.max(0, baseScore - issuePenalty - warningPenalty);
  }

  /**
   * Test connectivity to AI services
   * @returns {Promise<Object>} Connectivity test results
   */
  async testConnectivity() {
    const results = {
      overall: 'unknown',
      models: {},
      errors: [],
      timestamp: new Date().toISOString()
    };

    if (!this.isAiConfigured()) {
      results.overall = 'failed';
      results.errors.push('AI services not configured');
      return results;
    }

    // Test each available model
    const models = Object.keys(aiConfig.getAvailableModels());
    let successCount = 0;

    for (const modelName of models) {
      try {
        const testResult = await modelManager.testModel(modelName);
        results.models[modelName] = testResult;
        
        if (testResult.success) {
          successCount++;
        }
      } catch (error) {
        results.models[modelName] = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Determine overall status
    if (successCount === models.length) {
      results.overall = 'success';
    } else if (successCount > 0) {
      results.overall = 'partial';
    } else {
      results.overall = 'failed';
    }

    results.successRate = `${successCount}/${models.length}`;
    return results;
  }

  /**
   * Get service capabilities and limitations
   * @returns {Object} Capabilities information
   */
  getCapabilities() {
    const modelDetails = aiConfig.getAvailableModels();
    const maxTokens = Math.max(...Object.values(modelDetails).map(m => m.maxTokens));
    
    return {
      summaryTypes: ['brief', 'detailed', 'bullet-points', 'comprehensive', 'focused'],
      episodeSections: ['overview', 'keyPoints', 'topics', 'quotes', 'actionItems'],
      maxTranscriptLength: 100000, // 100k characters
      maxModelTokens: maxTokens,
      supportsBatch: true,
      supportsRetry: true,
      supportsEpisodeSummary: true,
      supportsFallback: true,
      models: Object.keys(modelDetails),
      providers: ['Google Gemini']
    };
  }

  /**
   * Get service usage statistics (placeholder for future implementation)
   * @returns {Object} Usage statistics
   */
  getUsageStats() {
    // This would integrate with actual usage tracking in production
    return {
      available: false,
      message: 'Usage statistics not implemented yet',
      placeholder: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageProcessingTime: 0,
        topModelsUsed: [],
        topSummaryTypes: []
      }
    };
  }

  /**
   * Generate service status report
   * @returns {Promise<Object>} Comprehensive status report
   */
  async generateStatusReport() {
    const [providerStatus, connectivity, healthStatus] = await Promise.all([
      Promise.resolve(this.getAIProviderStatus()),
      this.testConnectivity().catch(error => ({ error: error.message })),
      Promise.resolve(this.getHealthStatus())
    ]);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        configured: this.isAiConfigured(),
        healthy: healthStatus.status === 'healthy',
        connectivity: connectivity.overall || 'unknown'
      },
      provider: providerStatus,
      health: healthStatus,
      connectivity: connectivity,
      capabilities: this.getCapabilities(),
      usage: this.getUsageStats(),
      recommendations: this.getRecommendations(providerStatus, healthStatus, connectivity)
    };
  }

  /**
   * Generate recommendations based on status
   * @param {Object} providerStatus - Provider status info
   * @param {Object} healthStatus - Health check results
   * @param {Object} connectivity - Connectivity test results
   * @returns {Array<string>} Recommendations
   */
  getRecommendations(providerStatus, healthStatus, connectivity) {
    const recommendations = [];

    if (!providerStatus.configured) {
      recommendations.push('Configure Gemini API key to enable AI-powered summaries');
    }

    if (healthStatus.issues && healthStatus.issues.length > 0) {
      recommendations.push('Address critical configuration issues for optimal performance');
    }

    if (connectivity.overall === 'failed') {
      recommendations.push('Check network connectivity and API key permissions');
    } else if (connectivity.overall === 'partial') {
      recommendations.push('Some models are unavailable - consider using alternative models');
    }

    if (healthStatus.warnings && healthStatus.warnings.length > 0) {
      recommendations.push('Review and resolve service warnings when possible');
    }

    if (recommendations.length === 0) {
      recommendations.push('AI services are operating normally');
    }

    return recommendations;
  }

  /**
   * Monitor service status continuously (placeholder for future implementation)
   * @param {number} intervalMs - Monitoring interval in milliseconds
   * @returns {Object} Monitor control
   */
  startMonitoring(intervalMs = 300000) { // 5 minutes default
    return {
      available: false,
      message: 'Continuous monitoring not implemented yet',
      interval: intervalMs
    };
  }
}

module.exports = new StatusManager();
