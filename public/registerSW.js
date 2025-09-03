// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Root SW registration disabled to avoid conflicts with client app SW.
    // Consolidated to use client/public/serviceWorker.js only.
    console.log('[registerSW] Root SW registration disabled; using client/public service worker.');
  });
}
