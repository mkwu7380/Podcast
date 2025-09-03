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
                e.target.src = '/placeholder-podcast.png';
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
              {podcast.primaryGenreName && (
                <div className="meta-item btn-inline">
                  <span>🏷️</span>
                  <span>{podcast.primaryGenreName}</span>
                </div>
              )}
              
              {podcast.trackCount && (
                <div className="meta-item btn-inline">
                  <span>📊</span>
                  <span>{podcast.trackCount} episodes</span>
                </div>
              )}
            </div>
            
            {podcast.longDescription || podcast.shortDescription || podcast.description ? (
              <p className="episode-description">
                {(podcast.longDescription || podcast.shortDescription || podcast.description)?.slice(0, 200)}...
              </p>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Episodes List */}
      <div className="episodes-container">
        {episodes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No Episodes Found</h3>
            <p>This podcast doesn't have any available episodes, or we couldn't load them.</p>
          </div>
        ) : (
          <>
            <div className="section-header">
              <h2 className="section-title">Episodes</h2>
            </div>
            
            <div className="episodes-grid">
              {displayedEpisodes.map((episode, idx) => {
                const isPlaying = playingEpisode && playingEpisode.guid === episode.guid;
                return (
                  <div 
                    key={episode.guid || `episode-${idx}`}
                    className={`episode-card ${isPlaying ? 'playing' : ''}`}
                  >
                    <div className="episode-header">
                      {/* Episode Number/Icon */}
                      <div className="episode-number"
                        onClick={episode.enclosure?.url ? () => togglePlay(episode) : undefined}
                      >
                        {isPlaying ? '⏸️' : (idx + 1)}
                      </div>
                      
                      {/* Episode Details */}
                      <div className="episode-content">
                        <h3 className="episode-title">
                          {episode.title || `Episode ${idx + 1}`}
                        </h3>
                        
                        <div className="episode-meta-row">
                          {episode.pubDate && (
                            <span className="meta-item">
                              <span className="meta-icon-sm">📅</span>
                              {formatDate(episode.pubDate)}
                            </span>
                          )}
                          
                          {(episode.duration || episode.itunes?.duration) && (
                            <span className="meta-item">
                              <span className="meta-icon-sm">⏱️</span>
                              {formatDuration(episode.duration || episode.itunes?.duration)}
                            </span>
                          )}
                        </div>
                        
                        {episode.description && (
                          <p className="episode-description">
                            {episode.description.slice(0, 150)}...
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="episode-actions">
                      {episode.enclosure?.url && (
                        <>
                          <button 
                            className={`btn btn-sm ${isPlaying ? 'btn-secondary' : 'btn-primary'} btn-inline`}
                            onClick={() => togglePlay(episode)}
                          >
                            <span>{isPlaying ? '⏸️' : '▶️'}</span>
                            {isPlaying ? 'Pause' : 'Play'}
                          </button>
                          
                          <a 
                            href={episode.enclosure.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline btn-inline"
                          >
                            <span>🔗</span>
                            Direct Link
                          </a>
                          
                          <button 
                            className="btn btn-sm btn-outline btn-inline"
                            onClick={() => handleSummarizeEpisode(episode)}
                            title="Generate AI summary of this episode"
                          >
                            <span>🤖</span>
                            AI Summary
                          </button>
                        </>
                      )}
                    </div>
                    
                    {isPlaying && episode.enclosure?.url && (
                      <div className="audio-player">
                        <audio 
                          className="audio-element"
                          controls 
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
        />
      )}
    </div>
  );
}

export default PodcastDetails;
