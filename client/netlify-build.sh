#!/bin/bash
set -e

echo "=== Starting Netlify Build ==="

# Print Node.js and npm versions
node -v
npm -v

# Clean up any previous builds
echo "Cleaning up previous builds..."
rm -rf node_modules/ dist/ package-lock.json

# Install dependencies (including build tools)
echo "Installing all dependencies..."
NODE_ENV=development npm install --no-package-lock --no-audit --no-fund

# Verify webpack-cli is installed
echo "Verifying webpack-cli installation..."
npx webpack-cli --version

# Build the application
echo "Building application..."
NODE_ENV=production npm run build

echo "=== Build completed successfully! ==="
ls -la dist/
