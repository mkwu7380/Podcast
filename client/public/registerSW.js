// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  const isDevServer = window.location.port === '3001'; // webpack-dev-server
  const enableSWDev = window.location.search.includes('swdev=1') || localStorage.getItem('enableSWDev') === '1';
  const shouldRegister = !isDevServer || enableSWDev; // allow on server (3000), skip on dev server unless overridden

  if (!shouldRegister) {
    // Skip SW on webpack dev server to avoid cache/HMR issues.
    console.log('[registerSW] Skipping service worker on webpack-dev-server (port 3001).');
  } else {
    if (isDevServer && enableSWDev) {
      console.log('[registerSW] Dev override enabled; registering Service Worker on webpack-dev-server.');
    }

    // Auto-reload when the new SW takes control (enabled for non-dev-server environments)
    if (!isDevServer) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/serviceWorker.js')
        .then(registration => {
          // Removed registration.update() to avoid forced update loop
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
}
