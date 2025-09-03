import React, { useState, useMemo } from 'react';

/**
 * Podcast Summary Mind Map Component
 * Interactive visualization of podcast episode content and key insights
 */
const AISummaryMindMap = ({ 
  isVisible = true, 
  compact = false, 
  summaryData = null,
  selectedPodcast = null 
}) => {
  const [activeSection, setActiveSection] = useState('overview');

  // Ensure activeSection is valid
  const validActiveSection = useMemo(() => {
    const sections = (summaryData || sampleSummary)?.sections || {};
    return Object.keys(sections).includes(activeSection) ? activeSection : Object.keys(sections)[0] || 'overview';
  }, [activeSection, summaryData, sampleSummary]);

  // Sample data structure for demonstration - will be replaced with real data
  const sampleSummary = useMemo(() => ({
    title: selectedPodcast?.collectionName || "Sample Podcast Episode",
    overview: "A comprehensive discussion about productivity, time management, and building successful habits in the modern workplace.",
    sections: {
      overview: {
        title: '📋 Episode Overview',
        color: '#3b82f6',
        items: [
          'Main topic: Productivity & Time Management',
          'Duration: 45 minutes',
          'Guest: Tim Ferriss',
          'Key focus: Building effective systems'
        ]
      },
      topics: {
        title: '🎯 Key Topics',
        color: '#10b981',
        items: [
          '⚡ The 80/20 Principle',
          '🎯 Goal Setting Strategies',
          '📱 Digital Minimalism',
          '🧘 Mindfulness in Work'
        ]
      },
      insights: {
        title: '💡 Key Insights',
        color: '#f59e0b',
        items: [
          'Focus on systems, not goals',
          'Eliminate before optimizing',
          'Batch similar tasks together',
          'Regular breaks improve productivity'
        ]
      },
      quotes: {
        title: '💬 Notable Quotes',
        color: '#8b5cf6',
        items: [
          '"You are the average of the 5 people you spend the most time with"',
          '"What we fear doing most is usually what we most need to do"',
          '"Being busy is a form of laziness"'
        ]
      },
      actions: {
        title: '✅ Action Items',
        color: '#ef4444',
        items: [
          'Implement daily morning routine',
          'Try the 2-minute rule for small tasks',
          'Schedule weekly review sessions',
          'Limit email checking to 3x per day'
        ]
      }
    }
  }), [selectedPodcast]);

  const summary = useMemo(() => summaryData || sampleSummary, [summaryData, sampleSummary]);

  if (!isVisible) return null;

  return (
    <div className="podcast-mindmap-container" style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: compact ? '1rem' : '2rem',
      margin: '1rem 0',
      maxWidth: '100%',
      overflow: 'auto'
    }}>
      {!compact && (
        <div className="mindmap-header" style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
            margin: '0 0 0.5rem 0'
          }}>
            🎧 {summary.title}
          </h3>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            margin: '0',
            fontStyle: 'italic',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {summary.overview}
          </p>
        </div>
      )}

      {/* Summary Sections Grid */}
      <div className="summary-sections" style={{
        display: 'grid',
        gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {Object.entries(summary.sections || {}).map(([key, section]) => (
          <div key={key}>
            {/* Section Card */}
            <div 
              className={`section-card ${validActiveSection === key ? 'active' : ''}`}
              onClick={() => setActiveSection(key)}
              style={{
                background: validActiveSection === key ? section.color : 'var(--bg-primary)',
                color: validActiveSection === key ? 'white' : 'var(--text-primary)',
                border: `2px solid ${section.color}`,
                borderRadius: '12px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: validActiveSection === key ? '0 8px 20px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
                transform: validActiveSection === key ? 'translateY(-2px)' : 'none'
              }}
            >
              <h4 style={{
                margin: '0 0 1rem 0',
                fontSize: compact ? '1rem' : '1.2rem',
                fontWeight: '600'
              }}>
                {section.title}
              </h4>
              
              {/* Section Items */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {section.items.slice(0, validActiveSection === key ? undefined : 2).map((item, i) => (
                  <div key={i} style={{
                    fontSize: compact ? '0.8rem' : '0.9rem',
                    opacity: validActiveSection === key ? 1 : 0.8,
                    padding: '0.3rem 0',
                    lineHeight: '1.4',
                    borderBottom: i < section.items.length - 1 && validActiveSection === key ? 
                      '1px solid rgba(255,255,255,0.2)' : 'none',
                    paddingBottom: i < section.items.length - 1 && validActiveSection === key ? '0.5rem' : '0.3rem'
                  }}>
                    {item}
                  </div>
                ))}
                
                {/* Show more indicator */}
                {validActiveSection !== key && section.items.length > 2 && (
                  <div style={{
                    fontSize: '0.8rem',
                    opacity: 0.6,
                    fontStyle: 'italic',
                    marginTop: '0.5rem'
                  }}>
                    +{section.items.length - 2} more...
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Section Content */}
      {summary.sections && summary.sections[validActiveSection] && (
        <div className="section-details" style={{
          background: 'var(--bg-primary)',
          border: `2px solid ${summary.sections[validActiveSection].color}`,
          borderRadius: '12px',
          padding: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '4px',
              height: '2rem',
              background: summary.sections[validActiveSection].color,
              marginRight: '1rem',
              borderRadius: '2px'
            }}></div>
            <h4 style={{
              color: summary.sections[validActiveSection].color,
              margin: '0',
              fontSize: '1.3rem',
              fontWeight: '600'
            }}>
              {summary.sections[validActiveSection].title}
            </h4>
          </div>

          <div className="section-content" style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {(summary.sections[validActiveSection].items || []).map((item, index) => (
              <div key={index} style={{
                background: 'var(--bg-secondary)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                transition: 'all 0.2s ease'
              }}>
                {validActiveSection === 'quotes' ? (
                  <blockquote style={{
                    margin: '0',
                    fontStyle: 'italic',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    borderLeft: `4px solid ${summary.sections[validActiveSection].color}`,
                    paddingLeft: '1rem'
                  }}>
                    {item}
                  </blockquote>
                ) : (
                  <div style={{
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}>
                    <span style={{
                      color: summary.sections[validActiveSection].color,
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      minWidth: '1.5rem'
                    }}>
                      {index + 1}.
                    </span>
                    <span>{item}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Lines Visualization */}
      {!compact && (
        <div className="connections" style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <h5 style={{
            color: 'var(--text-primary)',
            margin: '0 0 1rem 0',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🔗 Episode Structure
          </h5>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.85rem'
          }}>
            {Object.entries(summary.sections).map(([key, section], index) => (
              <React.Fragment key={key}>
                <div 
                  onClick={() => setActiveSection(key)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: activeSection === key ? section.color : 'transparent',
                    color: activeSection === key ? 'white' : section.color,
                    border: `2px solid ${section.color}`,
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {section.title.split(' ')[1] || section.title}
                </div>
                {index < Object.keys(summary.sections).length - 1 && (
                  <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AISummaryMindMap;
