/**
 * Component for episode summarization functionality
 */
function EpisodeSummary({ episode, onClose }) {
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [summaryType, setSummaryType] = React.useState('comprehensive');

  const summaryTypes = [
    { value: 'brief', label: 'Brief Summary', description: '2-3 sentences overview' },
    { value: 'comprehensive', label: 'Comprehensive', description: 'Detailed analysis with key insights' },
    { value: 'detailed', label: 'Detailed', description: 'In-depth breakdown with quotes' },
    { value: 'bullet-points', label: 'Bullet Points', description: 'Key points in list format' }
  ];

  const handleSummarize = async () => {
    if (!episode?.enclosure?.url) {
      setError('No audio URL available for this episode');
      return;
    }

    setLoading(true);
    setError('');
    setSummary(null);

    try {
      const response = await fetch('/api/summary/episode-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audioUrl: episode.enclosure.url,
          summaryType: summaryType,
          episodeInfo: {
            title: episode.title,
            pubDate: episode.pubDate,
            duration: episode.duration || episode.itunes?.duration
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSummary(data.data);
      } else {
        setError(data.error || 'Failed to generate summary');
      }
    } catch (err) {
      console.error('Summary error:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  const formatSummaryContent = (summaryData) => {
    if (summaryData.summary && typeof summaryData.summary === 'object') {
      // Structured episode summary
      return (
        <div className="structured-summary">
          {summaryData.summary.overview && (
            <div className="summary-section">
              <h4>📝 Overview</h4>
              <p>{summaryData.summary.overview}</p>
            </div>
          )}
          
          {summaryData.summary.keyPoints && (
            <div className="summary-section">
              <h4>🔑 Key Points</h4>
              <p>{summaryData.summary.keyPoints}</p>
            </div>
          )}
          
          {summaryData.summary.topics && (
            <div className="summary-section">
              <h4>📋 Topics Covered</h4>
              <p>{summaryData.summary.topics}</p>
            </div>
          )}
          
          {summaryData.summary.quotes && (
            <div className="summary-section">
              <h4>💬 Notable Quotes</h4>
              <p>{summaryData.summary.quotes}</p>
            </div>
          )}
          
          {summaryData.summary.actionItems && (
            <div className="summary-section">
              <h4>✅ Action Items</h4>
              <p>{summaryData.summary.actionItems}</p>
            </div>
          )}
        </div>
      );
    } else {
      // Simple text summary
      return (
        <div className="simple-summary">
          <p>{summaryData.summary?.summary || summaryData.summary}</p>
          {summaryData.summary?.note && (
            <p className="summary-note">
              <em>{summaryData.summary.note}</em>
            </p>
          )}
        </div>
      );
    }
  };

  return (
    <div className="episode-summary-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>🤖 AI Episode Summary</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="episode-info">
          <h4>{episode.title}</h4>
          <p className="episode-meta">
            Published: {episode.pubDate}
            {episode.duration && ` • Duration: ${episode.duration}`}
          </p>
        </div>

        <div className="summary-controls">
          <div className="summary-type-selector">
            <label htmlFor="summaryType">Summary Type:</label>
            <select 
              id="summaryType"
              value={summaryType} 
              onChange={(e) => setSummaryType(e.target.value)}
              disabled={loading}
            >
              {summaryTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            className="summarize-btn"
            onClick={handleSummarize}
            disabled={loading}
          >
            {loading ? '🔄 Generating Summary...' : '🚀 Generate Summary'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="loading-summary">
            <div className="loading-spinner"></div>
            <p>
              Downloading and transcribing episode... This may take a few minutes.
              <br />
              <small>Processing: Audio download → Transcription → AI Summary</small>
            </p>
          </div>
        )}

        {summary && (
          <div className="summary-results">
            <div className="summary-header">
              <h4>📄 Summary ({summary.summary?.type || summaryType})</h4>
              <div className="summary-actions">
                <button 
                  className="copy-btn"
                  onClick={() => copyToClipboard(
                    typeof summary.summary === 'string' 
                      ? summary.summary 
                      : JSON.stringify(summary.summary, null, 2)
                  )}
                  title="Copy summary to clipboard"
                >
                  📋 Copy
                </button>
              </div>
            </div>
            
            <div className="summary-content">
              {formatSummaryContent(summary)}
            </div>
            
            {summary.transcript && (
              <details className="transcript-section">
                <summary>📝 View Full Transcript</summary>
                <div className="transcript-content">
                  <pre>{summary.transcript}</pre>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(summary.transcript)}
                  >
                    📋 Copy Transcript
                  </button>
                </div>
              </details>
            )}
            
            <div className="summary-meta">
              <small>
                Generated: {new Date(summary.processingTime).toLocaleString()}
                {summary.summary?.model && ` • Model: ${summary.summary.model}`}
                {summary.summary?.wordCount && ` • Words: ${summary.summary.wordCount}`}
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
