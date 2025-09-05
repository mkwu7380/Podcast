import React, { useState, useRef, useEffect } from 'react';
import EpisodeSummary from '../EpisodeSummary';

/**
 * Modern Podcast Details Component
 * Features enhanced episode cards, improved responsive layout, and better UX
 */
const PodcastDetails = ({ 
  podcast, 
  episodes, 
  episodesLoading, 
  error, 
  loadMoreEpisodes, 
  hasMoreEpisodes, 
  totalEpisodes,
  currentPage, 
  pageSize, 
  onPageChange, 
  onBack,
  onMindMapGenerated 
}) => {
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [playingEpisode, setPlayingEpisode] = useState(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSummarizeEpisode = (episode) => {
    setSelectedEpisode(episode);
    setShowSummary(true);
  };

  const closeSummary = () => {
    if (isMountedRef.current) {
      setShowSummary(false);
      setSelectedEpisode(null);
    }
  };

  const togglePlay = (episode) => {
    if (!isMountedRef.current) return;
    
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
      <div className="details-header">
        <button 
          className="btn btn-secondary btn-inline"
          onClick={onBack}
        >
          <span>⬅️</span>
          Back to Results
        </button>
        
        <div className="details-meta">
          <span className="meta-item">
            <span className="meta-icon">🎧</span>
            {episodes.length} episodes
          </span>
          {totalPages > 1 && (
            <span className="meta-item">
              <span className="meta-icon">📄</span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      </div>
      
      {/* Podcast Overview Card */}
      <div className="podcast-overview-card">
        <div className="card-overlay"></div>
        
        <div className="overview-grid">
          <div className="podcast-artwork">
            <img 
              src={podcast.artworkUrl600 || podcast.artworkUrl100} 
              alt={podcast.collectionName || podcast.trackName}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjdGQUZDIi8+CjxwYXRoIGQ9Ik02MCA4NEMzMi42ODYzIDg0IDQwIDc2LjMxMzcgNDAgNzBDNDAgNjMuNjg2MyA0Ny42ODYzIDU2IDU0IDU2QzYwLjMxMzcgNTYgNjcgNjMuNjg2MyA2NyA3MEM2NyA3Ni4zMTM3IDc0LjY4NjMgODQgODEgODRaIiBmaWxsPSIjQ0JENUUwIi8+CjxwYXRoIGQ9Ik02MCA3NkM0Ni43NDUyIDc2IDM2IDY1LjI1NDggMzYgNTJDMzYgMzguNzQ1MiA0Ni43NDUyIDI4IDYwIDI4Qzc3LjI1NDggMjggODggMzguNzQ1MiA4OCA1MkM4OCA2NS4yNTQ4IDc3LjI1NDggNzYgODQgNzZaTTYwIDM2QzUwLjk1IDM2IDQ0IDQzLjA1IDQ0IDUyQzQ0IDYwLjk1IDUwLjk1IDY4IDYwIDY4Qzc0LjA1IDY4IDgxIDYwLjk1IDgxIDUyQzgxIDQzLjA1IDc0LjA1IDM2IDg0IDM2WiIgZmlsbD0iI0NCRDVFMCIvPgo8L3N2Zz4=';
              }}
            />
          </div>
          
          <div className="podcast-info">
            <h1 className="podcast-title-large">
              {podcast.collectionName || podcast.trackName}
            </h1>
            
            <p className="podcast-subtitle">
              by {podcast.artistName}
            </p>
            
            <div className="podcast-meta">
              <div className="meta-item">
                <span className="meta-icon">🏷️</span>
                <span>{podcast.primaryGenreName || 'Podcast'}</span>
              </div>
              
              <div className="meta-item">
                <span className="meta-icon">📊</span>
                <span>{podcast.trackCount || episodes.length} episodes</span>
              </div>
              
              {podcast.trackViewUrl && (
                <a 
                  href={podcast.trackViewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-small btn-outline"
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
        <div className="section-header">
          <h2 className="section-title">
            Recent Episodes
          </h2>
        </div>
        
        {episodes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎧</div>
            <h3>No episodes available</h3>
            <p>This podcast doesn't have any episodes yet, or they couldn't be loaded.</p>
          </div>
        ) : (
          <>
            <div className="episodes-grid">
              {displayedEpisodes.map((episode, i) => {
                const episodeNumber = (currentPage - 1) * pageSize + i + 1;
                const isPlaying = playingEpisode && playingEpisode.guid === episode.guid;
                
                return (
                  <div 
                    key={episode.guid || i} 
                    className={`episode-card slide-in delay-${i % 10}`}
                  >
                    <div className="episode-header">
                      <div className="episode-number">
                        {episodeNumber}
                      </div>
                      
                      <div className="episode-content">
                        <h3 className="episode-title">
                          {episode.title}
                        </h3>
                        
                        <div className="episode-meta-row">
                          <span className="meta-item">
                            <span className="meta-icon-sm">📅</span>
                            {formatDate(episode.pubDate)}
                          </span>
                          
                          {episode.itunes?.duration && (
                            <span className="meta-item">
                              <span className="meta-icon-sm">⏱️</span>
                              {formatDuration(episode.itunes.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {episode.contentSnippet && (
                      <p className="episode-description">
                        {episode.contentSnippet.length > 200 
                          ? `${episode.contentSnippet.slice(0, 200)}...` 
                          : episode.contentSnippet
                        }
                      </p>
                    )}
                    
                    <div className="episode-actions">
                      <button 
                        className="btn btn-small btn-primary"
                        onClick={() => togglePlay(episode)}
                      >
                        <span>{isPlaying ? '⏸️' : '▶️'}</span>
                        {isPlaying ? 'Pause' : 'Play'}
                      </button>
                      
                      {(episode.enclosure?.url || episode.enclosureUrl) && (
                        <a 
                          href={episode.enclosure?.url || episode.enclosureUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-small btn-secondary"
                        >
                          <span>🔗</span>
                          Direct Link
                        </a>
                      )}
                      
                      <button 
                        className="btn btn-small btn-outline"
                        onClick={() => {
                          setSelectedEpisode(episode);
                          setShowSummary(true);
                        }}
                      >
                        <span>🤖</span>
                        AI Summary
                      </button>
                    </div>
                    
                    {isPlaying && (episode.enclosure?.url || episode.enclosureUrl) && (
                      <div className="audio-player">
                        <audio 
                          className="audio-element"
                          controls 
                          autoPlay
                          onEnded={() => setPlayingEpisode(null)}
                        >
                          <source src={episode.enclosure?.url || episode.enclosureUrl} type="audio/mpeg" />
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
              <div className="pagination">
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
                
                <div className="pagination-info">
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
          onMindMapGenerated={onMindMapGenerated}
        />
      )}
    </div>
  );
}

export default PodcastDetails;
