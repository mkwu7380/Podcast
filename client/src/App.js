import React, { useState, useRef, useEffect } from 'react';
import './styles/styles.css';

// Import components
import PodcastSearch from './components/podcast/PodcastSearch';
import PodcastList from './components/podcast/PodcastList';
import PodcastDetails from './components/podcast/PodcastDetails';
import AudioTranscription from './components/AudioTranscription';
import License from './components/common/License';

/**
 * Main App Component - Modern Dashboard Layout with Sidebar Navigation
 * Features responsive design, improved UX, and modular component organization
 */
function App() {
  // State management
  const [darkMode, setDarkMode] = useState(false);
  
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
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
      // Dark mode gradient
      root.style.setProperty('--gradient-bg', 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)');
    } else {
      // Set light mode gradient by default
      root.style.setProperty('--gradient-bg', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    }
  }, []);
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
  const audioRef = useRef();

  // Constants
  const PODCAST_PAGE_SIZE = 8;
  const EPISODES_PER_PAGE = 10;

  // Define License component with fallback
  const LicenseComponent = window.License || (() => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">License</h2>
      </div>
      <div className="card-content">
        <p>License information could not be loaded. Please try again later.</p>
      </div>
    </div>
  ));

  // Main navigation items (excluding license - moved to footer)
  const navItems = [
    { id: 'search', label: 'Search Podcasts', icon: '🔍', active: activeView === 'search' },
    { id: 'transcribe', label: 'Audio Transcription', icon: '🎤', active: activeView === 'transcribe' },
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
    
    const socket = new WebSocket(`ws://${window.location.host}/ws/transcribe`);
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
    
    if (viewId === 'search') {
      setSelectedPodcast(null);
      setPodcasts([]);
      setPodcastName('');
      setEpisodes([]);
    }
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
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
      // Dark mode gradient
      root.style.setProperty('--gradient-bg', 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)');
    } else {
      // Light theme colors
      root.style.setProperty('--bg-primary', 'rgba(255, 255, 255, 0.95)');
      root.style.setProperty('--bg-secondary', 'rgba(248, 249, 250, 0.8)');
      root.style.setProperty('--text-primary', '#2d3748');
      root.style.setProperty('--text-secondary', '#4a5568');
      root.style.setProperty('--text-tertiary', '#718096');
      root.style.setProperty('--border-color', '#e2e8f0');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
      // Light mode gradient
      root.style.setProperty('--gradient-bg', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'search':
        return selectedPodcast ? `${selectedPodcast.collectionName}` : 'Discover Podcasts';
      case 'details':
        return selectedPodcast ? `${selectedPodcast.collectionName} - Episodes` : 'Podcast Details';
      case 'transcribe':
        return 'Audio Transcription';
      case 'license':
        return 'License';
      default:
        return 'Podcast Hub';
    }
  };

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
              onPageChange={setEpisodePage}
              onBack={() => handleNavigation('search')}
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
              />
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
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
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
                onClick={() => handleNavigation(item.id)}
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
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
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
