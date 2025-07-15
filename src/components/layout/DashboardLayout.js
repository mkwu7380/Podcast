/**
 * Main Dashboard Layout Component
 * Provides consistent layout structure with responsive sidebar and main content area
 * Features:
 * - Mobile-first responsive design
 * - Touch-friendly navigation
 * - Smooth transitions and animations
 * - Accessible navigation
 */
import React, { useState, useEffect } from 'react';

function DashboardLayout({ 
  children, 
  activeView, 
  onNavigate, 
  toggleDarkMode, 
  isDarkMode 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      // Auto-close sidebar on mobile when resizing to mobile
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = (e) => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };
  
  const navItems = [
    { id: 'search', label: 'Podcast Search', icon: '🔍' },
    { id: 'transcription', label: 'Audio Transcription', icon: '🎙️' }
  ];
  
  // Close sidebar when a nav item is clicked on mobile
  const handleNavClick = (view) => {
    onNavigate(view);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div 
      className={`app-layout ${sidebarOpen ? 'sidebar-visible' : ''} ${isMobile ? 'mobile' : ''}`}
      onClick={handleOverlayClick}
    >
      {/* Mobile Sidebar Toggle */}
      <button 
        className={`sidebar-toggle ${sidebarOpen ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleSidebar();
        }}
        aria-expanded={sidebarOpen}
        aria-controls="primary-navigation"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        <span className="hamburger">
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </span>
        <span className="sr-only">Menu</span>
      </button>
      
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
      
      {/* Sidebar Navigation */}
      <nav 
        id="primary-navigation"
        className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sidebar-header">
          <h2 className="app-title">
            <span className="logo-icon">🎧</span>
            <span className="logo-text">PodCrafter</span>
          </h2>
        </div>
        
        <div className="sidebar-content">
          <ul className="nav-list">
            {navItems.map(item => (
              <li key={item.id} className={activeView === item.id ? 'active' : ''}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavClick(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="sidebar-footer">
          <button 
            className="theme-toggle"
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="theme-icon">
              {isDarkMode ? '☀️' : '🌙'}
            </span>
            <span className="theme-label">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          
          <div className="app-info">
            <p className="app-version">v1.0.0</p>
            <p className="copyright">© {new Date().getFullYear()} PodCrafter</p>
          </div>
        </div>
      </nav>
      
      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-header">
          <h1 className="page-title">
            {activeView === 'search' && 'Podcast Search'}
            {activeView === 'details' && 'Podcast Details'}
            {activeView === 'transcription' && 'Audio Transcription'}
          </h1>
        </header>
        
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
