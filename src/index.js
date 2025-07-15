/**
 * Entry point for the React application
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Get the root element
const container = document.getElementById('root');
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to enable service worker for PWA functionality
// import { register } from './serviceWorker';
// register();
