#!/bin/sh
set -e

# Replace environment variables in the built files
find /usr/share/nginx/html -type f -name "*.js" -o -name "*.html" -o -name "*.json" | xargs sed -i \
  -e "s|\$REACT_APP_API_URL|${REACT_APP_API_URL:-/api}|g" \
  -e "s|\$REACT_APP_WS_URL|${REACT_APP_WS_URL:-ws://localhost:3001/ws}|g" \
  -e "s|\$REACT_APP_GA_TRACKING_ID|${REACT_APP_GA_TRACKING_ID:-}|g" \
  -e "s|\$REACT_APP_SENTRY_DSN|${REACT_APP_SENTRY_DSN:-}|g" \
  -e "s|\$REACT_APP_VERSION|${REACT_APP_VERSION:-1.0.0}|g" \
  -e "s|\$REACT_APP_NAME|${REACT_APP_NAME:-podcast-client}|g"

# Start Nginx
exec "$@"
