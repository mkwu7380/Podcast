import React, { useState } from 'react';

/**
 * Modern Podcast Details Component
 * Features enhanced episode cards, improved responsive layout, and better UX
 */
const PodcastDetails = ({ 
  podcast, 
  episodes, 
  currentPage, 
  pageSize, 
  onPageChange, 
  onBack 
}) => {
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [playingEpisode, setPlayingEpisode] = useState(null);

  const handleSummarizeEpisode = (episode) => {
    setSelectedEpisode(episode);
    setShowSummary(true);
  };

  const closeSummary = () => {
    setShowSummary(false);
    setSelectedEpisode(null);
  };

  const togglePlay = (episode) => {
    if (playingEpisode && playingEpisode.guid === episode.guid) {
      setPlayingEpisode(null);
    } else {
      setPlayingEpisode(episode);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    const seconds = parseInt(duration);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const totalPages = Math.ceil(episodes.length / pageSize);
  const displayedEpisodes = episodes.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );

  return (
    <div className="podcast-details-container fade-in">
      {/* Header with Navigation */}
      <div className="details-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <button 
          className="btn btn-secondary"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>⬅️</span>
          Back to Results
        </button>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          color: '#718096',
          fontSize: '0.9rem'
        }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.5rem' }}>🎧</span>
            {episodes.length} episodes
          </span>
          {totalPages > 1 && (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '0.5rem' }}>📄</span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      </div>
      
      {/* Podcast Overview Card */}
      <div className="podcast-overview-card" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: 'white',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(1px)'
        }}></div>
        
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '2rem',
          alignItems: 'start'
        }}>
          <div className="podcast-artwork" style={{
            width: '120px',
            height: '120px',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <img 
              src={podcast.artworkUrl600 || podcast.artworkUrl100} 
              alt={podcast.collectionName || podcast.trackName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjdGQUZDIi8+CjxwYXRoIGQ9Ik02MCA4NEMzMi42ODYzIDg0IDQwIDc2LjMxMzcgNDAgNzBDNDAgNjMuNjg2MyA0Ny42ODYzIDU2IDU0IDU2QzYwLjMxMzcgNTYgNjcgNjMuNjg2MyA2NyA3MEM2NyA3Ni4zMTM3IDc0LjY4NjMgODQgODEgODRaIiBmaWxsPSIjQ0JENUUwIi8+CjxwYXRoIGQ9Ik02MCA3NkM0Ni43NDUyIDc2IDM2IDY1LjI1NDggMzYgNTJDMzYgMzguNzQ1MiA0Ni43NDUyIDI4IDYwIDI4Qzc3LjI1NDggMjggODggMzguNzQ1MiA4OCA1MkM4OCA2NS4yNTQ4IDc3LjI1NDggNzYgODQgNzZaTTYwIDM2QzUwLjk1IDM2IDQ0IDQzLjA1IDQ0IDUyQzQ0IDYwLjk1IDUwLjk1IDY4IDYwIDY4Qzc0LjA1IDY4IDgxIDYwLjk1IDgxIDUyQzgxIDQzLjA1IDc0LjA1IDM2IDg0IDM2WiIgZmlsbD0iI0NCRDVFMCIvPgo8L3N2Zz4=';
              }}
            />
          </div>
          
          <div className="podcast-info">
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              {podcast.collectionName || podcast.trackName}
            </h1>
            
            <p style={{
              fontSize: '1.1rem',
              opacity: '0.9',
              marginBottom: '1rem'
            }}>
              by {podcast.artistName}
            </p>
            
            <div style={{
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🏷️</span>
                <span>{podcast.primaryGenreName || 'Podcast'}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📊</span>
                <span>{podcast.trackCount || episodes.length} episodes</span>
              </div>
              
              {podcast.trackViewUrl && (
                <a 
                  href={podcast.trackViewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>🍎</span>
                  Apple Podcasts
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="episodes-section">
        <div className="section-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2d3748',
            margin: 0
          }}>
            Recent Episodes
          </h2>
        </div>
        
        {episodes.length === 0 ? (
          <div className="empty-state" style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            color: '#718096'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎧</div>
            <h3 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>No episodes available</h3>
            <p>This podcast doesn't have any episodes yet, or they couldn't be loaded.</p>
          </div>
        ) : (
          <>
            <div className="episodes-grid" style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {displayedEpisodes.map((episode, i) => {
                const episodeNumber = (currentPage - 1) * pageSize + i + 1;
                const isPlaying = playingEpisode && playingEpisode.guid === episode.guid;
                
                return (
                  <div 
                    key={episode.guid || i} 
                    className="episode-card slide-in"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="episode-header" style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div className="episode-number" style={{
                        background: '#667eea',
                        color: 'white',
                        borderRadius: '50%',
                        width: '2rem',
                        height: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {episodeNumber}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="episode-title" style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#2d3748',
                          marginBottom: '0.5rem',
                          lineHeight: '1.4'
                        }}>
                          {episode.title}
                        </h3>
                        
                        <div className="episode-meta" style={{
                          display: 'flex',
                          gap: '1rem',
                          flexWrap: 'wrap',
                          fontSize: '0.85rem',
                          color: '#718096'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.25rem' }}>📅</span>
                            {formatDate(episode.pubDate)}
                          </span>
                          
                          {episode.itunes?.duration && (
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: '0.25rem' }}>⏱️</span>
                              {formatDuration(episode.itunes.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {episode.contentSnippet && (
                      <p className="episode-description" style={{
                        color: '#4a5568',
                        lineHeight: '1.6',
                        marginBottom: '1rem'
                      }}>
                        {episode.contentSnippet.length > 200 
                          ? `${episode.contentSnippet.slice(0, 200)}...` 
                          : episode.contentSnippet
                        }
                      </p>
                    )}
                    
                    <div className="episode-actions" style={{
                      display: 'flex',
                      gap: '0.75rem',
                      flexWrap: 'wrap'
                    }}>
                      {episode.enclosure?.url && (
                        <>
                          <button 
                            className={`btn btn-sm ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => togglePlay(episode)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span>{isPlaying ? '⏸️' : '▶️'}</span>
                            {isPlaying ? 'Pause' : 'Play'}
                          </button>
                          
                          <a 
                            href={episode.enclosure.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline"
                            style={{
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span>🔗</span>
                            Direct Link
                          </a>
                          
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => handleSummarizeEpisode(episode)}
                            title="Generate AI summary of this episode"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span>🤖</span>
                            AI Summary
                          </button>
                        </>
                      )}
                    </div>
                    
                    {isPlaying && episode.enclosure?.url && (
                      <div className="audio-player" style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'rgba(102, 126, 234, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(102, 126, 234, 0.1)'
                      }}>
                        <audio 
                          controls 
                          style={{ width: '100%' }}
                          onEnded={() => setPlayingEpisode(null)}
                        >
                          <source src={episode.enclosure.url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: '2rem' }}>
                <button 
                  className="pagination-btn"
                  onClick={() => onPageChange(1)}
                  disabled={currentPage === 1}
                  title="First page"
                >
                  ⏮️
                </button>
                
                <button 
                  className="pagination-btn"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  title="Previous page"
                >
                  ⬅️ Previous
                </button>
                
                <div className="pagination-info" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '0 1rem'
                }}>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => onPageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  title="Next page"
                >
                  Next ➡️
                </button>
                
                <button 
                  className="pagination-btn"
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last page"
                >
                  ⏭️
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Episode Summary Modal */}
      {showSummary && selectedEpisode && (
        <EpisodeSummary 
          episode={selectedEpisode}
          onClose={closeSummary}
        />
      )}
    </div>
  );
}

export default PodcastDetails;
