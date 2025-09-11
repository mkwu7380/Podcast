# Podcast Client

A modern React-based client for the Podcast application. This client provides a responsive user interface for browsing, searching, and playing podcasts.

## Features

- 🎙️ Browse and search podcasts
- 🎧 Play podcast episodes
- 📱 Responsive design for all devices
- 🎨 Dark/light theme support
- ⚡ Fast and optimized performance
- 🛠 Developer-friendly setup

## Prerequisites

- Node.js 16.14.0 or higher
- npm 8.0.0 or higher

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/podcast-app.git
   cd podcast-app/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

1. Copy the example environment file and update the values as needed:
   ```bash
   cp .env.example .env.development
   ```

2. Update the environment variables in `.env.development`:
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_WS_URL=ws://localhost:3001/ws
   ```

### Development

Start the development server:
```bash
npm start
```

This will start the development server at http://localhost:3000

### Building for Production

1. Create a production build:
   ```bash
   npm run build
   ```

2. The build files will be available in the `dist` directory.

### Testing

Run the test suite:
```bash
npm test
```

### Linting and Formatting

- Lint the code:
  ```bash
  npm run lint
  ```

- Format the code:
  ```bash
  npm run format
  ```

## Project Structure

```
src/
├── assets/           # Static assets (images, fonts, etc.)
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks
├── pages/            # Page components
├── services/         # API services
├── store/            # State management
├── styles/           # Global styles and themes
├── utils/            # Utility functions
├── App.js            # Main application component
└── index.js          # Application entry point
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `development` |
| `REACT_APP_API_URL` | Base URL for API requests | `/api` |
| `REACT_APP_WS_URL` | WebSocket URL for real-time updates | `ws://localhost:3001/ws` |
| `REACT_APP_GA_TRACKING_ID` | Google Analytics tracking ID | - |
| `REACT_APP_SENTRY_DSN` | Sentry DSN for error tracking | - |

## Available Scripts

- `npm start` - Start the development server
- `npm run build` - Create a production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Deployment

### Netlify

1. Connect your repository to Netlify
2. Set the build command: `npm run build`
3. Set the publish directory: `dist`
4. Add environment variables in the Netlify dashboard

### Vercel

1. Import your repository to Vercel
2. Set the framework preset to "Create React App"
3. Add environment variables in the Vercel dashboard

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
