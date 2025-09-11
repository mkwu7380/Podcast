#!/bin/bash
set -e

echo "=== Starting Netlify Build ==="

# Print Node.js and npm versions
node -v
npm -v

# Clean up any previous builds
echo "Cleaning up previous builds..."
rm -rf node_modules/ dist/ package-lock.json

# Install dependencies
echo "Installing dependencies..."
npm install --no-package-lock --no-audit --no-fund

# Build the application
echo "Building application..."
npm run build

echo "=== Build completed successfully! ==="
ls -la dist/
