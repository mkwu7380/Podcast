import React, { useState, useRef, useEffect, useCallback } from 'react';
import './styles/styles.css';

// Import components
import PodcastSearch from './components/podcast/PodcastSearch';
import PodcastList from './components/podcast/PodcastList';
import PodcastDetails from './components/podcast/PodcastDetails';
import AudioTranscription from './components/AudioTranscription';
import License from './components/common/License';
import AISummaryMindMap from './components/common/AISummaryMindMap';

/**
 * Main App Component - Modern Dashboard Layout with Sidebar Navigation
 * Features responsive design, improved UX, and modular component organization
 */
function App() {
  // State management
  const [darkMode, setDarkMode] = useState(false);
  const [activeView, setActiveView] = useState('search');
  const [podcastName, setPodcastName] = useState('');
  const [podcasts, setPodcasts] = useState([]);
  const [podcastPage, setPodcastPage] = useState(1);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [episodePage, setEpisodePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [rtTranscript, setRtTranscript] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mindMapData, setMindMapData] = useState(null);
  const [mindMapCache, setMindMapCache] = useState([]);
  const audioRef = useRef();

  // Load cached mind maps from localStorage on component mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('podcast-mindmap-cache');
      if (cached) {
        setMindMapCache(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Error loading mind map cache:', error);
    }
  }, []);
  
  // Simple URL update function
  const updateURL = (viewId) => {
    const paths = {
      'search': '/search-podcast',
      'transcribe': '/audio-transcription',
      'details': '/podcast-details',
      'license': '/license'
    };
    const path = paths[viewId] || '/';
    window.history.pushState(null, '', path);
  };

  // Initialize dark mode based on system preference
  useEffect(() => {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDarkMode);
    // Apply the theme immediately
    const root = document.documentElement;
    if (isDarkMode) {
      // Dark theme colors
      root.style.setProperty('--bg-primary', 'rgba(26, 32, 44, 0.95)');
      root.style.setProperty('--bg-secondary', 'rgba(17, 24, 39, 0.9)');
      root.style.setProperty('--text-primary', '#f7fafc');
      root.style.setProperty('--text-secondary', '#e2e8f0');
      root.style.setProperty('--text-tertiary', '#a0aec0');
      root.style.setProperty('--border-color', 'rgba(var(--neutral-rgb), 0.12)');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
      // Card tokens for dark
      root.style.setProperty('--card-glass', 'rgba(26, 32, 44, 0.95)');
      root.style.setProperty('--card-border', 'rgba(var(--neutral-rgb), 0.08)');
      // Dark mode gradient
      root.style.setProperty('--gradient-bg', 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)');
      // Overlay tuning for dark
      root.style.setProperty('--hero-overlay-alpha', '0.06');
      root.style.setProperty('--hero-overlay-alpha-secondary', '0.06');
      root.style.setProperty('--section-overlay-top', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--section-overlay-bottom', 'rgba(0, 0, 0, 0.12)');
    } else {
      // Set light mode gradient by default
      root.style.setProperty('--gradient-bg', 'var(--accent-gradient-135)');
      // Card tokens for light
      root.style.setProperty('--card-glass', 'rgba(var(--neutral-rgb), 0.95)');
      root.style.setProperty('--card-border', 'rgba(var(--neutral-rgb), 0.2)');
      // Overlay tuning for light
      root.style.setProperty('--hero-overlay-alpha', '0.12');
      root.style.setProperty('--hero-overlay-alpha-secondary', '0.12');
      root.style.setProperty('--section-overlay-top', 'rgba(var(--neutral-rgb), 0.06)');
      root.style.setProperty('--section-overlay-bottom', 'rgba(0, 0, 0, 0.06)');
    }
  }, []);

  // Constants
  const PODCAST_PAGE_SIZE = 8;
  const EPISODES_PER_PAGE = 10;
  const TITLE_SUFFIX = ' - PodcastHub';

  // Use the imported License component
  const LicenseComponent = License;

  // Main navigation items (excluding license - moved to footer)
  const navItems = [
    { id: 'search', label: 'Search Podcasts', icon: '🔍', active: activeView === 'search' },
    { id: 'transcribe', label: 'Audio Transcription', icon: '🎤', active: activeView === 'transcribe' },
    { id: 'history', label: 'Mind Map History', icon: '📚', active: activeView === 'history' },
    ...(selectedPodcast ? [{ id: 'details', label: 'Podcast Details', icon: '📱', active: activeView === 'details' }] : [])
  ];

  // API handlers
  const handleSearch = async () => {
    if (!podcastName.trim()) {
      setError('Please enter a podcast name.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSelectedPodcast(null);
    setPodcasts([]);
    
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastName, limit: 50 })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.podcasts?.length > 0) {
          setPodcasts(data.podcasts);
          setPodcastPage(1);
        } else {
          setError('No podcasts found with that name.');
        }
      } else {
        setError(data.error || 'Search failed. Please try again.');
      }
    } catch (e) {
      console.error('Search error:', e);
      setError('Error connecting to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndSetEpisodes = async (feedUrl) => {
    setLoading(true);
    try {
      const res = await fetch('/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedUrl, limit: 0 })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setEpisodes(data.episodes || []);
        setEpisodePage(1);
      } else {
        setError(data.error || 'Failed to fetch episodes.');
      }
    } catch (e) {
      console.error('Episodes fetch error:', e);
      setError('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPodcast = (podcast) => {
    setSelectedPodcast(podcast);
    setActiveView('details');
    updateURL('details');
    fetchAndSetEpisodes(podcast.feedUrl);
  };

  const handleTranscribe = async (e) => {
    e.preventDefault();
    const file = audioRef.current?.files[0];
    if (!file) {
      setError('Please select an audio file.');
      return;
    }
    
    setTranscript('');
    setError('');
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', file);
      
      const res = await fetch('/api/transcribe', { 
        method: 'POST', 
        body: formData 
      });
      
      const data = await res.json();
      
      if (res.ok && data.transcript) {
        setTranscript(data.transcript);
      } else {
        setError(data.error || 'Transcription failed.');
      }
    } catch (e) {
      console.error('Transcription error:', e);
      setError('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeTranscribe = () => {
    const file = audioRef.current?.files[0];
    if (!file) {
      setError('Please select an audio file.');
      return;
    }
    
    setRtTranscript('');
    setError('');
    
    const wsUrl = `ws://${window.location.host}/ws/transcribe`;
    const socket = new WebSocket(wsUrl);
    socket.binaryType = 'arraybuffer';
    
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.transcript) {
        setRtTranscript(prev => prev + msg.transcript);
      }
      if (msg.final) {
        socket.close();
      }
    };
    
    socket.onerror = (e) => {
      console.error('WebSocket error:', e);
      setError('WebSocket error.');
    };
    
    socket.onopen = async () => {
      const chunkSize = 128 * 1024;
      let offset = 0;
      
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + chunkSize);
        const buf = await chunk.arrayBuffer();
        socket.send(buf);
        offset += chunkSize;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      socket.send('end');
    };
  };

  const handleNavigation = (viewId) => {
    setActiveView(viewId);
    setError('');
    setMobileMenuOpen(false);
    updateURL(viewId, viewId === 'details' ? selectedPodcast : null);
    
    if (viewId === 'search') {
      setSelectedPodcast(null);
      setPodcasts([]);
      setPodcastName('');
      setEpisodes([]);
    }
  };

  const handleMindMapGenerated = (mindMapResult) => {
    setMindMapData(mindMapResult);
    
    // Cache the mind map with timestamp and metadata
    const cacheEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      title: mindMapResult.title || 'Untitled Mind Map',
      data: mindMapResult,
      source: 'transcript'
    };
    
    const newCache = [cacheEntry, ...mindMapCache.slice(0, 9)]; // Keep last 10
    setMindMapCache(newCache);
    
    // Save to localStorage
    try {
      localStorage.setItem('podcast-mindmap-cache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving mind map cache:', error);
    }
    
    // Automatically switch to history view when generated
    handleNavigation('history');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Update CSS variables based on dark mode
    const root = document.documentElement;
    if (newDarkMode) {
      // Dark theme colors
      root.style.setProperty('--bg-primary', 'rgba(26, 32, 44, 0.95)');
      root.style.setProperty('--bg-secondary', 'rgba(17, 24, 39, 0.9)');
      root.style.setProperty('--text-primary', '#f7fafc');
      root.style.setProperty('--text-secondary', '#e2e8f0');
      root.style.setProperty('--text-tertiary', '#a0aec0');
      root.style.setProperty('--border-color', 'rgba(var(--neutral-rgb), 0.12)');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
      // Card tokens for dark
      root.style.setProperty('--card-glass', 'rgba(26, 32, 44, 0.95)');
      root.style.setProperty('--card-border', 'rgba(var(--neutral-rgb), 0.08)');
      // Dark mode gradient
      root.style.setProperty('--gradient-bg', 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)');
    } else {
      // Light theme colors
      root.style.setProperty('--bg-primary', 'rgba(var(--neutral-rgb), 0.95)');
      root.style.setProperty('--bg-secondary', 'rgba(248, 249, 250, 0.8)');
      root.style.setProperty('--text-primary', '#2d3748');
      root.style.setProperty('--text-secondary', '#4a5568');
      root.style.setProperty('--text-tertiary', '#718096');
      root.style.setProperty('--border-color', '#e2e8f0');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
      // Card tokens for light
      root.style.setProperty('--card-glass', 'rgba(var(--neutral-rgb), 0.95)');
      root.style.setProperty('--card-border', 'rgba(var(--neutral-rgb), 0.2)');
      // Light mode gradient
      root.style.setProperty('--gradient-bg', 'var(--accent-gradient-135)');
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getPageTitle = useCallback(() => {
    switch (activeView) {
      case 'search':
        return selectedPodcast ? `${selectedPodcast.collectionName}` : 'Discover Podcasts';
      case 'details':
        return selectedPodcast ? `${selectedPodcast.collectionName} - Episodes` : 'Podcast Details';
      case 'transcribe':
        return 'Audio Transcription';
      case 'history':
        return 'Mind Map History';
      case 'license':
        return 'License';
      default:
        return 'Podcast Hub';
    }
  }, [activeView, selectedPodcast]);

  // Keep browser tab title in sync with current view, always adding the suffix
  // When searching: show contextual title like "<query> - Searching" or "<query> - Results"
  useEffect(() => {
    try {
      let base = getPageTitle();
      if (activeView === 'search') {
        const q = (podcastName || '').trim();
        if (loading) {
          base = `${q ? q + ' - ' : ''}Searching`;
        } else if (q) {
          base = `${q} - Results`;
        }
      }
      document.title = `${base}${TITLE_SUFFIX}`;
    } catch (e) {
      // no-op: document may be unavailable in some environments
    }
  }, [getPageTitle, activeView, podcastName, loading]);

  const renderMainContent = () => {
    switch (activeView) {
      case 'search':
        return (
          <div className="content-grid fade-in">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Search Podcasts</h2>
                <div className="card-badge">Discover</div>
              </div>
              <PodcastSearch 
                podcastName={podcastName}
                setPodcastName={setPodcastName}
                onSearch={handleSearch}
                loading={loading}
                error={error}
              />
            </div>
            
            {podcasts.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Search Results</h2>
                  <div className="card-badge">{podcasts.length} found</div>
                </div>
                <PodcastList 
                  podcasts={podcasts}
                  currentPage={podcastPage}
                  pageSize={PODCAST_PAGE_SIZE}
                  onPageChange={setPodcastPage}
                  onSelectPodcast={handleSelectPodcast}
                  loading={loading}
                />
              </div>
            )}
          </div>
        );
        
      case 'details':
        return selectedPodcast ? (
          <div className="content-grid fade-in">
            <PodcastDetails 
              podcast={selectedPodcast}
              episodes={episodes}
              currentPage={episodePage}
              pageSize={EPISODES_PER_PAGE}
              episodesLoading={episodesLoading}
              error={error}
              hasMoreEpisodes={hasMoreEpisodes}
              totalEpisodes={totalEpisodes}
              onPageChange={setEpisodePage}
              loadMoreEpisodes={loadMoreEpisodes}
              onBack={() => handleNavigation('search')}
              onMindMapGenerated={handleMindMapGenerated}
            />
          </div>
        ) : (
          <div className="card fade-in">
            <div className="loading">
              <div className="spinner"></div>
              Loading podcast details...
            </div>
          </div>
        );
        
      case 'transcribe':
        return (
          <div className="content-grid fade-in">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Audio Transcription</h2>
                <div className="card-badge">AI Powered</div>
              </div>
              <AudioTranscription 
                onTranscribe={handleTranscribe}
                onRealTimeTranscribe={handleRealTimeTranscribe}
                transcript={transcript}
                rtTranscript={rtTranscript}
                error={error}
                audioRef={audioRef}
                loading={loading}
                onMindMapGenerated={handleMindMapGenerated}
              />
            </div>
          </div>
        );
        
      case 'mindmap':
        return (
          <div className="content-grid fade-in">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Mind Map</h2>
                <div className="card-badge">Interactive</div>
              </div>
              <AISummaryMindMap 
                isVisible={true} 
                compact={false} 
                selectedPodcast={selectedPodcast}
                summaryData={mindMapData}
              />
            </div>
          </div>
        );
        
      case 'history':
        return (
          <div className="content-grid fade-in">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Mind Map History</h2>
                <div className="card-badge">{mindMapCache.length} saved</div>
              </div>
              
              {mindMapCache.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
                  <h3 style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                    No Mind Maps Yet
                  </h3>
                  <p style={{ color: 'var(--text-tertiary)', margin: '0' }}>
                    Generate your first mind map from audio transcription to see it here
                  </p>
                </div>
              ) : (
                <div style={{ padding: '1.5rem' }}>
                  <div style={{
                    display: 'grid',
                    gap: '1rem',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
                  }}>
                    {mindMapCache.map((cacheEntry, index) => (
                      <div
                        key={cacheEntry.id}
                        onClick={() => {
                          setMindMapData(cacheEntry.data);
                          setActiveView('mindmap');
                        }}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '2px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-primary)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.transform = 'translateY(0px)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '1rem'
                        }}>
                          <h4 style={{
                            color: 'var(--text-primary)',
                            margin: '0',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            lineHeight: '1.3'
                          }}>
                            {cacheEntry.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newCache = mindMapCache.filter(item => item.id !== cacheEntry.id);
                              setMindMapCache(newCache);
                              localStorage.setItem('podcast-mindmap-cache', JSON.stringify(newCache));
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-tertiary)',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: '4px',
                              fontSize: '0.9rem'
                            }}
                            title="Delete mind map"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '1rem',
                          lineHeight: '1.4'
                        }}>
                          {cacheEntry.data.overview?.slice(0, 120) + (cacheEntry.data.overview?.length > 120 ? '...' : '')}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8rem',
                          color: 'var(--text-tertiary)'
                        }}>
                          <span>
                            {new Date(cacheEntry.timestamp).toLocaleDateString()} at {new Date(cacheEntry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <span style={{
                            background: 'var(--bg-secondary)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem'
                          }}>
                            {cacheEntry.source}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {mindMapCache.length > 0 && (
                    <div style={{
                      marginTop: '2rem',
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center'
                    }}>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to clear all cached mind maps?')) {
                            setMindMapCache([]);
                            localStorage.removeItem('podcast-mindmap-cache');
                          }
                        }}
                        className="btn btn-secondary"
                        style={{
                          fontSize: '0.85rem',
                          padding: '0.5rem 1rem'
                        }}
                      >
                        🗑️ Clear All History
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'license':
        return (
          <div className="content-grid fade-in">
            <LicenseComponent />
          </div>
        );
        
      default:
        return (
          <div className="card fade-in">
            <div className="card-header">
              <h2 className="card-title">Welcome to Podcast Hub</h2>
            </div>
            <p>Select an option from the sidebar to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <nav className={`sidebar ${mobileMenuOpen ? 'mobile-visible' : 'mobile-hidden'}`}>
        {/* Sidebar Content with Padding */}
        <div style={{ padding: '1.5rem', paddingBottom: '0', flex: '1', display: 'flex', flexDirection: 'column' }}>
          <div className="sidebar-header">
            {/* Clean Logo Section with Theme Toggle in Top Right */}
            <div style={{ 
              padding: '0 0 1rem 0',
              borderBottom: '1px solid var(--border-color)',
              position: 'relative'
            }}>
              {/* Theme Toggle - Top Right Corner */}
              <div 
                onClick={toggleDarkMode}
                style={{ 
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'var(--bg-secondary-hover)',
                  fontSize: '1rem',
                  width: '2rem',
                  height: '2rem'
                }}
              >
                {darkMode ? '🌙' : '☀️'}
              </div>
              
              {/* Centered Logo and Text */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>
                  🎧
                </div>
                <h1 style={{ 
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  margin: '0 0 0.3rem 0',
                  color: 'var(--text-primary)'
                }}>
                  PodcastHub
                </h1>
                <p style={{ 
                  fontSize: '0.85rem',
                  margin: '0',
                  opacity: '0.8',
                  color: 'var(--text-secondary)'
                }}>
                  Discover & Transcribe
                </p>
              </div>
            </div>
          </div>
          
          <div className="nav-section">
            <h3>Main</h3>
            {navItems.map((item) => (
              <div 
                key={item.id}
                className={`nav-item ${item.active ? 'active' : ''}`}
                onClick={() => {
                  handleNavigation(item.id);
                }}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
          
          {selectedPodcast && (
            <div className="nav-section">
              <h3>Current Podcast</h3>
              <div className="nav-item" style={{ cursor: 'default', opacity: 0.8 }}>
                <span className="nav-item-icon">🎧</span>
                <div style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    {selectedPodcast.collectionName}
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                    by {selectedPodcast.artistName}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Bottom Section: About and License - truly stuck to bottom */}
          <div style={{ 
            marginTop: 'auto',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1rem',
            paddingBottom: '1rem'
          }}>
            {/* About Section - Compact */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ 
                fontSize: '0.9rem',
                margin: '0 0 0.5rem 0',
                opacity: 0.8,
                textAlign: 'center'
              }}>About</h3>
              <div style={{ 
                fontSize: '0.8rem',
                opacity: 0.6,
                textAlign: 'center',
                lineHeight: '1.4',
                padding: '0 0.5rem'
              }}>
                Modern podcast discovery and transcription platform
              </div>
            </div>
            
            {/* License Acknowledgment - clickable small text */}
            <div style={{ padding: '0 1rem' }}>
              <div 
                onClick={() => handleNavigation('license')}
                style={{ 
                  fontSize: '0.7rem',
                  opacity: 0.5,
                  color: 'var(--text-tertiary)',
                  textAlign: 'center',
                  lineHeight: '1.3',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                  textDecoration: 'underline',
                  textDecorationColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.8';
                  e.target.style.textDecorationColor = 'var(--text-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '0.5';
                  e.target.style.textDecorationColor = 'transparent';
                }}
              >
                Licensed under MIT
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content Area */}
      <main className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-content">
            <div className="header-left">
              <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
                ☰
              </button>
              <h1 className="page-title">{getPageTitle()}</h1>
            </div>
            
            <div className="header-right">
              {loading && (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Error Display */}
        {error && (
          <div className="error fade-in">
            <span className="error-icon">⚠️</span>
            {error}
            <button 
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        )}
        
        {/* Main Content */}
        {renderMainContent()}
      </main>
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 50,
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default App;
