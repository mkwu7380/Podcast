/**
 * Main Dashboard Layout Component
 * Provides consistent layout structure with responsive sidebar and main content area
 */
import React, { useState } from 'react';

function DashboardLayout({ 
  children, 
  activeView, 
  onNavigate, 
  toggleDarkMode, 
  isDarkMode 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const navItems = [
    { id: 'search', label: 'Podcast Search', icon: '🔍' },
    { id: 'transcription', label: 'Audio Transcription', icon: '🎙️' }
  ];
  
  return (
    <div className={`app-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      {/* Mobile Sidebar Toggle */}
      <button 
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
      
      {/* Sidebar Navigation */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
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
                  onClick={() => {
                    onNavigate(item.id);
                    // On mobile, close sidebar after navigation
                    if (window.innerWidth <= 768) {
                      setSidebarOpen(false);
                    }
                  }}
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
