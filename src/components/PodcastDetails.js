/**
 * Modern Podcast Details Component
 * Features enhanced episode cards, improved responsive layout, and better UX
 */
import React from 'react';
import EpisodeSummary from './EpisodeSummary';

function PodcastDetails({ 
  podcast, 
  episodes, 
  currentPage, 
  pageSize, 
  onPageChange, 
  onBack 
}) {
  const [selectedEpisode, setSelectedEpisode] = React.useState(null);
  const [showSummary, setShowSummary] = React.useState(false);
  const [playingEpisode, setPlayingEpisode] = React.useState(null);

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
                e.target.src = '/placeholder-podcast.png';
              }}
            />
          </div>
          
          <div className="podcast-info">
            <h2 style={{ 
              fontSize: '1.6rem', 
              fontWeight: '800', 
              marginBottom: '0.5rem' 
            }}>
              {podcast.collectionName || podcast.trackName}
            </h2>
            
            <p style={{ 
              fontSize: '1.1rem', 
              marginBottom: '1rem',
              opacity: 0.9
            }}>
              by {podcast.artistName}
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              flexWrap: 'wrap',
              marginBottom: '1rem'
            }}>
              {podcast.primaryGenreName && (
                <span style={{ 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  backdropFilter: 'blur(5px)'
                }}>
                  {podcast.primaryGenreName}
                </span>
              )}
              
              {podcast.trackCount && (
                <span style={{ 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  backdropFilter: 'blur(5px)'
                }}>
                  {podcast.trackCount} episodes
                </span>
              )}
              
              {podcast.country && (
                <span style={{ 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  backdropFilter: 'blur(5px)'
                }}>
                  {podcast.country}
                </span>
              )}
            </div>
            
            {podcast.longDescription || podcast.shortDescription || podcast.description ? (
              <p style={{ 
                fontSize: '0.95rem', 
                lineHeight: '1.5',
                opacity: 0.85,
                maxHeight: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {podcast.longDescription || podcast.shortDescription || podcast.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Episodes List */}
      <div className="episodes-container">
        {episodes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No Episodes Found</h3>
            <p>This podcast doesn't have any available episodes, or we couldn't load them.</p>
          </div>
        ) : (
          <>
            <h3 style={{ 
              fontSize: '1.25rem', 
              marginBottom: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              Episodes
            </h3>
            
            <div className="episodes-list" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {displayedEpisodes.map((episode, idx) => {
                const isPlaying = playingEpisode && playingEpisode.guid === episode.guid;
                return (
                  <div 
                    key={episode.guid || `episode-${idx}`}
                    className={`episode-item ${isPlaying ? 'playing' : ''}`}
                    style={{
                      background: 'var(--bg-primary)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid var(--border-color)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem'
                    }}>
                      {/* Episode Number/Icon */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: isPlaying ? '#667eea' : 'var(--bg-secondary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: isPlaying ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => togglePlay(episode)}
                      >
                        {isPlaying ? '⏹️' : '▶️'}
                      </div>
                      
                      {/* Episode Details */}
                      <div style={{ flex: '1 1 auto' }}>
                        <h4 style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          marginBottom: '0.5rem',
                          color: 'var(--text-primary)',
                          lineHeight: '1.4'
                        }}>
                          {episode.title || `Episode ${idx + 1}`}
                        </h4>
                        
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          fontSize: '0.85rem',
                          color: 'var(--text-tertiary)',
                          marginBottom: '1rem',
                          alignItems: 'center'
                        }}>
                          {episode.pubDate && (
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: '0.25rem' }}>📅</span>
                              {formatDate(episode.pubDate)}
                            </span>
                          )}
                          
                          {(episode.duration || episode.itunes?.duration) && (
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: '0.25rem' }}>⏱️</span>
                              {formatDuration(episode.duration || episode.itunes?.duration)}
                            </span>
                          )}
                        </div>
                        
                        {episode.description && (
                          <p style={{
                            fontSize: '0.95rem',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.5',
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {episode.description.replace(/<[^>]*>/g, '')}
                          </p>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => togglePlay(episode)}
                          style={{
                            background: isPlaying ? '#e53e3e' : '#667eea',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isPlaying ? (
                            <>
                              <span>⏹️</span>
                              Stop
                            </>
                          ) : (
                            <>
                              <span>▶️</span>
                              Play
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleSummarizeEpisode(episode)}
                          style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>🤖</span>
                          AI Summary
                        </button>
                      </div>
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
