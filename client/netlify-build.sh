#!/bin/bash
set -e

# Clean up any previous builds
rm -rf node_modules/
rm -rf dist/
rm -rf .npm/
rm -f package-lock.json

# Set npm config
npm config set cache .npm --global
npm config set update-notifier false
npm config set fund false
npm config set audit false
npm config set loglevel warn

# Install Node.js version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js
nvm install 16.14.0
nvm use 16.14.0

# Install npm
npm install -g npm@8.19.4

# Install dependencies
npm ci --no-package-lock

# Build the application
npm run build

echo "Build completed successfully!"
