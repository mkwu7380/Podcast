# Podcast Scraper

A simple Node.js application to scrape podcast information from RSS feeds using the `rss-parser` library.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the scraper:
   ```bash
   npm start
   ```

## Usage
- Edit `index.js` to change the RSS feed URL to the podcast of your choice.
- The script will output the podcast title, description, total episodes, and details of the 5 most recent episodes.

## Example RSS Feeds
- The Joe Rogan Experience: `https://feeds.simplecast.com/54nAGcIl`
- TED Talks Daily: `https://feeds.feedburner.com/tedtalks_audio`
