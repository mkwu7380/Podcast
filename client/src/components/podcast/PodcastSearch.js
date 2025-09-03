import React from 'react';

/**
 * Modern Podcast Search Component
 * Features improved UX, better form design, and responsive layout
 */
const PodcastSearch = ({ 
  podcastName, 
  setPodcastName, 
  onSearch, 
  loading, 
  error 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading && podcastName.trim()) {
      onSearch();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading && podcastName.trim()) {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="search-section">
      <div className="search-intro">
        <p style={{ 
          color: '#718096', 
          fontSize: '0.95rem', 
          marginBottom: '1.5rem', 
          lineHeight: '1.5' 
        }}>
          Search for your favorite podcasts from millions of shows available. 
          Find episodes, get transcriptions, and discover new content.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search for podcasts... (e.g., 'The Daily', 'Joe Rogan')"
            value={podcastName}
            onChange={(e) => setPodcastName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            required
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        
        <div className="search-actions" style={{ 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center',
          marginTop: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <button 
            type="submit" 
            className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
            disabled={loading || !podcastName.trim()}
            style={{ minWidth: '140px' }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ 
                  width: '1rem', 
                  height: '1rem', 
                  marginRight: '0.5rem' 
                }}></div>
                Searching...
              </>
            ) : (
              <>
                <span style={{ marginRight: '0.5rem' }}>🔍</span>
                Search Podcasts
              </>
            )}
          </button>
          
          {podcastName && !loading && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => setPodcastName('')}
              style={{ minWidth: '80px' }}
            >
              <span style={{ marginRight: '0.25rem' }}>✕</span>
              Clear
            </button>
          )}
        </div>
        
        {podcastName && (
          <div className="search-hints" style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(102, 126, 234, 0.05)', 
            borderRadius: '8px',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
            <p style={{ 
              fontSize: '0.85rem', 
              color: '#667eea', 
              margin: 0,
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '0.5rem' }}>💡</span>
              <strong>Tip:</strong> Try being specific with podcast names for better results. 
              You can search for show titles, host names, or network names.
            </p>
          </div>
        )}
      </form>
      
      {loading && (
        <div className="loading fade-in" style={{ 
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#667eea', fontSize: '0.95rem' }}>
            🔍 Searching the podcast universe for "{podcastName}"...
          </p>
          <p style={{ 
            color: '#a0aec0', 
            fontSize: '0.85rem',
            marginTop: '0.5rem'
          }}>
            This may take a few moments
          </p>
        </div>
      )}
    </div>
  );
};

export default PodcastSearch;
