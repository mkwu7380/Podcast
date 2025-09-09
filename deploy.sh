#!/bin/bash

# Podcast App Deployment Script
# This script helps deploy your podcast application

set -e

echo "🚀 Podcast App Deployment Helper"
echo "================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Function to build and run with Docker
deploy_docker() {
    echo "📦 Building Docker image..."
    docker build -t podcast-app .
    
    echo "🛑 Stopping existing containers..."
    docker stop podcast-app 2>/dev/null || true
    docker rm podcast-app 2>/dev/null || true
    
    echo "🚀 Starting new container..."
    docker run -d \
        --name podcast-app \
        -p 3000:3000 \
        -v $(pwd)/uploads:/app/uploads \
        --restart unless-stopped \
        podcast-app
    
    echo "✅ Application deployed successfully!"
    echo "🌐 Access your app at: http://localhost:3000"
    echo "📚 API docs at: http://localhost:3000/api-docs"
}

# Function to deploy with docker-compose
deploy_compose() {
    echo "📦 Deploying with Docker Compose..."
    docker-compose down
    docker-compose build
    docker-compose up -d
    
    echo "✅ Application deployed successfully with Docker Compose!"
    echo "🌐 Access your app at: http://localhost:3000"
}

# Function to prepare for cloud deployment
prepare_cloud() {
    echo "☁️ Preparing for cloud deployment..."
    
    # Build client for production
    echo "📦 Building client..."
    cd client
    npm install
    npm run build
    cd ..
    
    # Install production dependencies
    echo "📦 Installing production dependencies..."
    npm ci --only=production
    
    echo "✅ Ready for cloud deployment!"
    echo ""
    echo "Next steps:"
    echo "1. For Railway: Push to GitHub and connect to Railway"
    echo "2. For Render: Push to GitHub and connect to Render"
    echo "3. For VPS: Copy files and run 'npm start'"
}

# Function to deploy website only (static)
deploy_website() {
    echo "🌐 Deploying website (frontend only)..."
    
    cd client
    echo "📦 Installing client dependencies..."
    npm install
    
    echo "🏗️ Building static website..."
    npm run build
    
    echo "✅ Website built successfully in client/dist!"
    echo ""
    echo "Deployment options:"
    echo "📦 Netlify: Drag & drop client/dist folder to netlify.app/drop"
    echo "📦 Vercel: Run 'vercel --prod' in root directory"
    echo "📦 GitHub Pages: Push to GitHub and enable Pages from /client/dist"
    echo "📦 Surge: Run 'npm install -g surge && surge client/dist'"
    echo ""
    echo "⚠️  Remember to update API URLs in your deployment platform:"
    echo "   Replace 'your-backend-url' in netlify.toml and vercel.json"
    
    cd ..
}

# Function to deploy full-stack
deploy_fullstack() {
    echo "🚀 Deploying full-stack application..."
    
    echo "📦 Building frontend..."
    cd client
    npm install
    npm run build
    cd ..
    
    echo "📦 Installing backend dependencies..."
    npm install
    
    echo "✅ Full-stack application ready!"
    echo ""
    echo "Recommended deployment approach:"
    echo "1. 🎯 Backend: Deploy to Railway/Render/Fly.io using existing config"
    echo "2. 🎯 Frontend: Deploy to Netlify/Vercel (faster for static content)"
    echo "3. 🔗 Update API URLs in frontend deployment settings"
    echo ""
    echo "Alternative: Deploy everything together using Docker:"
    echo "   docker build -t podcast-fullstack ."
    echo "   docker run -p 3000:3000 podcast-fullstack"
}

# Main menu
echo ""
echo "Choose deployment method:"
echo "1. Docker (local)"
echo "2. Docker Compose (local with nginx)"
echo "3. Prepare for cloud deployment"
echo "4. Deploy website only (static)"
echo "5. Deploy full-stack (backend + frontend)"
echo "6. Exit"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        deploy_docker
        ;;
    2)
        deploy_compose
        ;;
    3)
        prepare_cloud
        ;;
    4)
        deploy_website
        ;;
    5)
        deploy_fullstack
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
