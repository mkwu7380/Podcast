import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Component for episode summarization functionality
 */
const EpisodeSummary = ({ episode, onClose, onMindMapGenerated }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summaryType, setSummaryType] = useState('comprehensive');
  const [mindMapLoading, setMindMapLoading] = useState(false);
  
  // Modal dragging and resizing state
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const modalRef = useRef(null);
  const centeredOnce = useRef(false);

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

  const handleGenerateMindMap = async () => {
    if (!summary) {
      setError('No summary available to generate mind map');
      return;
    }

    setMindMapLoading(true);
    setError('');

    try {
      // Convert summary to transcript-like format for mind map generation
      const transcript = formatSummaryAsTranscript(summary);
      
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcript: transcript,
          episodeInfo: {
            title: episode.title,
            pubDate: episode.pubDate,
            duration: episode.duration || episode.itunes?.duration,
            source: 'episode-summary'
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Call the callback to handle mind map generation
        if (onMindMapGenerated) {
          onMindMapGenerated(data.data.mindMap, {
            title: episode.title,
            source: 'episode-summary',
            timestamp: new Date().toISOString()
          });
        }
        // Close the summary modal after generating mind map
        onClose();
      } else {
        setError(data.error || 'Failed to generate mind map');
      }
    } catch (err) {
      console.error('Mind map generation error:', err);
      setError('Error connecting to server for mind map generation');
    } finally {
      setMindMapLoading(false);
    }
  };

  const formatSummaryAsTranscript = (summaryData) => {
    // Convert structured summary to a narrative format for mind map generation
    let transcript = '';
    
    if (summaryData.summary && typeof summaryData.summary === 'object') {
      if (summaryData.summary.overview) {
        transcript += `Episode Overview: ${summaryData.summary.overview}\n\n`;
      }
      if (summaryData.summary.keyPoints) {
        transcript += `Key Points Discussed: ${summaryData.summary.keyPoints}\n\n`;
      }
      if (summaryData.summary.topics) {
        transcript += `Main Topics: ${summaryData.summary.topics}\n\n`;
      }
      if (summaryData.summary.quotes) {
        transcript += `Notable Quotes: ${summaryData.summary.quotes}\n\n`;
      }
      if (summaryData.summary.actionItems) {
        transcript += `Action Items: ${summaryData.summary.actionItems}\n\n`;
      }
    } else {
      // Simple text summary
      transcript = summaryData.summary?.summary || summaryData.summary || '';
    }
    
    return transcript.trim();
  };

  const formatSummaryAsMindMap = (summaryData) => {
    const episodeTitle = episode.title || 'Episode Summary';
    let mindMapText = `${episodeTitle}\n`;
    mindMapText += `${'='.repeat(Math.min(episodeTitle.length, 50))}\n\n`;

    if (summaryData.summary && typeof summaryData.summary === 'object') {
      // Structured episode summary
      if (summaryData.summary.overview) {
        mindMapText += `📝 Overview\n`;
        const overview = summaryData.summary.overview.replace(/\n/g, '\n│   ');
        mindMapText += `├── ${overview}\n\n`;
      }
      
      if (summaryData.summary.keyPoints) {
        mindMapText += `🔑 Key Points\n`;
        const keyPoints = summaryData.summary.keyPoints.split('\n').map((point, index, array) => {
          const prefix = index === array.length - 1 ? '└──' : '├──';
          return `${prefix} ${point.replace(/^\d+\.\s*/, '')}`;
        }).join('\n');
        mindMapText += `${keyPoints}\n\n`;
      }
      
      if (summaryData.summary.topics) {
        mindMapText += `📋 Topics Covered\n`;
        const topics = summaryData.summary.topics.replace(/Main topics discussed: /, '').split(', ');
        topics.forEach((topic, index) => {
          const prefix = index === topics.length - 1 ? '└──' : '├──';
          mindMapText += `${prefix} ${topic.trim()}\n`;
        });
        mindMapText += `\n`;
      }
      
      if (summaryData.summary.quotes) {
        mindMapText += `💬 Notable Quotes\n`;
        const quotes = summaryData.summary.quotes.replace(/\n/g, '\n│   ');
        mindMapText += `└── ${quotes}\n\n`;
      }
      
      if (summaryData.summary.actionItems) {
        mindMapText += `✅ Action Items\n`;
        const actionItems = summaryData.summary.actionItems.replace(/\n/g, '\n│   ');
        mindMapText += `└── ${actionItems}\n\n`;
      }
    } else {
      // Simple text summary
      const summaryText = summaryData.summary?.summary || summaryData.summary;
      const sentences = summaryText.split(/[.!?。！？]/).filter(s => s.trim().length > 10);
      
      mindMapText += `📝 Summary\n`;
      sentences.forEach((sentence, index) => {
        if (sentence.trim()) {
          const prefix = index === sentences.length - 1 ? '└──' : '├──';
          const cleanSentence = sentence.trim().replace(/^\d+\.\s*/, '');
          mindMapText += `${prefix} ${cleanSentence}\n`;
        }
      });
      mindMapText += `\n`;
      
      if (summaryData.summary?.note) {
        mindMapText += `📌 Note\n`;
        mindMapText += `└── ${summaryData.summary.note}\n\n`;
      }
    }

    // Add processing info
    mindMapText += `⚙️ Processing Info\n`;
    mindMapText += `├── Method: ${summaryData.summary?.method || 'Free Local Summarizer'}\n`;
    if (summaryData.summary?.compressionRatio) {
      mindMapText += `├── Compression: ${summaryData.summary.compressionRatio}\n`;
    }
    mindMapText += `├── Generated: ${new Date(summaryData.processingTime).toLocaleString()}\n`;
    
    // Add episode metadata
    mindMapText += `└── Episode: ${episode.pubDate}`;
    if (episode.duration) {
      mindMapText += ` • ${episode.duration}`;
    }
    mindMapText += `\n`;

    return mindMapText;
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

  // Dragging functionality
  const handleMouseDown = (e) => {
    if (e.target.closest('.close-btn') || e.target.closest('.resize-handle')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isResizing) {
      const newWidth = Math.max(400, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(300, resizeStart.height + (e.clientY - resizeStart.y));
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Resize functionality
  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  useEffect(() => {
    // Center the modal on initial mount
    if (!centeredOnce.current) {
      centeredOnce.current = true;
      try {
        const vw = window.innerWidth || 1200;
        const vh = window.innerHeight || 800;
        const maxW = Math.max(400, vw - 40);
        const maxH = Math.max(300, vh - 40);
        const initW = Math.min(size.width, maxW);
        const initH = Math.min(size.height, maxH);
        const x = Math.max(10, Math.round((vw - initW) / 2));
        const y = Math.max(10, Math.round((vh - initH) / 2));
        if (initW !== size.width || initH !== size.height) {
          setSize({ width: initW, height: initH });
        }
        setPosition({ x, y });
      } catch (e) {
        // no-op
      }
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDragging ? 'move' : 'nw-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, position, size]);

  return createPortal(
    <div className="episode-summary-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div 
        ref={modalRef}
        className="modal-content draggable-modal"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          position: 'fixed'
        }}
      >
        <div 
          className="modal-header draggable-header"
          onMouseDown={handleMouseDown}
        >
          <h3>🤖 AI Episode Summary</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {/* Resize Handle */}
        <div 
          className="resize-handle"
          onMouseDown={handleResizeStart}
        ></div>
        
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
                  onClick={() => copyToClipboard(formatSummaryAsMindMap(summary))}
                  title="Copy summary as mind map to clipboard"
                >
                  📋 Copy Mind Map
                </button>
                <button 
                  className="generate-mindmap-btn"
                  onClick={handleGenerateMindMap}
                  disabled={mindMapLoading}
                  title="Generate interactive mind map visualization"
                >
                  {mindMapLoading ? '🔄 Generating...' : '🧠 Generate Mind Map'}
                </button>
              </div>
            </div>
            
            <div className="summary-content">
              {formatSummaryContent(summary)}
            </div>
            
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
    </div>,
    document.body
  );
};

export default EpisodeSummary;
