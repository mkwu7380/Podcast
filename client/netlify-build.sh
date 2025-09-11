#!/bin/bash
set -e

echo "=== Starting build process ==="

# Clean up any previous builds
echo "Cleaning up previous builds..."
rm -rf node_modules/ dist/ .npm/ package-lock.json

# Set up NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use Node.js 16.14.0
echo "Setting up Node.js 16.14.0..."
nvm install 16.14.0
nvm use 16.14.0

# Install specific npm version
echo "Installing npm 8.19.4..."
npm install -g npm@8.19.4

# Configure npm
echo "Configuring npm..."
npm config set update-notifier false
npm config set fund false
npm config set audit false
npm config set loglevel warn
npm config set package-lock false

# Install dependencies
echo "Installing dependencies..."
npm ci --no-package-lock --prefer-offline --no-audit --no-fund

# Build the application
echo "Building application..."
npm run build

echo "=== Build completed successfully! ==="
