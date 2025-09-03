import React from 'react';

/**
 * Modern Podcast List Component
 * Features card-based design, improved pagination, and responsive layout
 */
const PodcastList = ({ 
  podcasts, 
  currentPage, 
  pageSize, 
  onPageChange, 
  onSelectPodcast,
  loading 
}) => {
  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '200px' }}>
        <div className="spinner"></div>
        Loading podcasts...
      </div>
    );
  }
  
  if (!podcasts || podcasts.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem 2rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No podcasts found</h3>
        <p>Try searching with different keywords or check your spelling.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(podcasts.length / pageSize);
  const displayedPodcasts = podcasts.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );

  const formatDescription = (description) => {
    if (!description) return 'No description available.';
    const cleaned = description.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > 150 ? cleaned.substring(0, 150) + '...' : cleaned;
  };

  return (
    <div className="podcast-list-container fade-in">
      {/* Simple Results Header */}
      <div className="results-header" style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        background: 'var(--bg-primary)',
        borderRadius: '12px',
        boxShadow: '0 2px 12px var(--shadow-color)'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          🎙️ Found {podcasts.length} Podcasts
        </h2>
        <p style={{
          margin: 0,
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          fontWeight: '500'
        }}>
          {totalPages > 1 ? `Page ${currentPage} of ${totalPages}` : 'Click any podcast to view episodes'}
        </p>
      </div>

      {/* Clean Podcast List */}
      <div className="podcast-list" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {displayedPodcasts.map((podcast, idx) => {
          const uniqueKey = podcast.collectionId || podcast.trackId || `${podcast.trackName}-${idx}`;
          return (
            <div 
              key={uniqueKey} 
              className="podcast-item"
              style={{
                display: 'flex',
                background: 'var(--bg-primary)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px var(--shadow-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid var(--border-color)'
              }}
              onClick={() => onSelectPodcast(podcast)}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 8px var(--shadow-color)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 1px 3px var(--shadow-color)';
              }}
            >
              {/* Podcast Image */}
              <div style={{ marginRight: '1.5rem', flexShrink: 0 }}>
                <img 
                  src={podcast.artworkUrl600 || podcast.artworkUrl100 || '/placeholder-podcast.png'} 
                  alt={podcast.collectionName || podcast.trackName}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '1px solid var(--border-color)'
                  }}
                  onError={(e) => {
                    e.target.style.background = 'var(--accent-gradient-135)';
                    e.target.style.display = 'flex';
                    e.target.style.alignItems = 'center';
                    e.target.style.justifyContent = 'center';
                    e.target.style.color = 'white';
                    e.target.style.fontSize = '1.5rem';
                    e.target.innerHTML = '🎙️';
                  }}
                />
              </div>
              
              {/* Podcast Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                  lineHeight: '1.3'
                }}>
                  {podcast.collectionName || podcast.trackName || 'Untitled Podcast'}
                </h3>
                
                {podcast.artistName && (
                  <p style={{
                    margin: 0,
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    by {podcast.artistName}
                  </p>
                )}
                
                {podcast.primaryGenreName && (
                  <span style={{
                    display: 'inline-block',
                    background: 'var(--accent-primary)',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem'
                  }}>
                    {podcast.primaryGenreName}
                  </span>
                )}
                
                <p style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  color: 'var(--text-tertiary)',
                  lineHeight: '1.4',
                  fontWeight: '500'
                }}>
                  {formatDescription(podcast.longDescription || podcast.shortDescription || podcast.description)}
                </p>
              </div>
              
              {/* Action Button */}
              <div style={{ marginLeft: '1.5rem', flexShrink: 0, alignSelf: 'center' }}>
                <button 
                  style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPodcast(podcast);
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(var(--accent-rgb), 0.9)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--accent-primary)';
                  }}
                >
                  View Episodes
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Simple Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          boxShadow: '0 1px 3px var(--shadow-color)'
        }}>
          <button 
            style={{
              background: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--accent-primary)',
              color: currentPage === 1 ? 'var(--text-secondary)' : 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          
          <span style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            padding: '0 1rem'
          }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            style={{
              background: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--accent-primary)',
              color: currentPage === totalPages ? 'var(--text-secondary)' : 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default PodcastList;
