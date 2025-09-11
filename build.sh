#!/bin/bash
set -e

# Navigate to the client directory
cd client

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

echo "Build completed successfully!"
