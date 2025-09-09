# 🚀 Podcast App Deployment Guide

## Quick Start

Run the deployment helper script:
```bash
./deploy.sh
```

## Deployment Options

### 1. 🐳 Docker (Local Development)
```bash
# Build and run
docker build -t podcast-app .
docker run -p 3000:3000 -v $(pwd)/uploads:/app/uploads podcast-app
```

### 2. 🌐 Cloud Platforms (Recommended)

#### Railway (Easiest)
1. Push code to GitHub
2. Connect repository to [Railway](https://railway.app)
3. Railway auto-detects the config from `railway.json`
4. Deploy automatically

#### Render
1. Push code to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Set build command: `npm install && cd client && npm install && npm run build`
4. Set start command: `npm start`

#### Fly.io
```bash
# Install flyctl
brew install flyctl

# Deploy
fly launch
fly deploy
```

### 3. 🖥️ VPS/Server Deployment

#### Prerequisites
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3 and pip
sudo apt-get install -y python3 python3-pip ffmpeg

# Install PM2 for process management
npm install -g pm2
```

#### Deploy
```bash
# Clone your repository
git clone <your-repo-url>
cd podcast

# Install dependencies
npm install
cd client && npm install && npm run build && cd ..
pip3 install -r requirements.txt

# Start with PM2
pm2 start index.js --name "podcast-app"
pm2 startup
pm2 save
```

## Environment Variables

Create `.env` file:
```bash
NODE_ENV=production
PORT=3000
# Add your API keys here
GOOGLE_API_KEY=your_key_here
```

## SSL Setup (Production)

### Using Nginx
```bash
# Install nginx and certbot
sudo apt install nginx certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Nginx will auto-configure HTTPS
```

## Health Checks

The app includes a health endpoint at `/health` for monitoring.

## Troubleshooting

### Common Issues
- **Python dependencies**: Ensure Python 3.8+ is installed
- **FFmpeg**: Required for audio processing
- **File uploads**: Check `uploads/` directory permissions
- **WebSocket**: Ensure WebSocket connections aren't blocked by firewall

### Logs
```bash
# Docker logs
docker logs podcast-app

# PM2 logs
pm2 logs podcast-app

# System logs
journalctl -u your-service-name
```

## Security Considerations

- Use environment variables for API keys
- Enable HTTPS in production
- Set up proper CORS policies
- Limit file upload sizes
- Regular security updates

## Scaling

- Use load balancer for multiple instances
- Consider Redis for session storage
- Implement file storage service (AWS S3, etc.)
- Use CDN for static assets
