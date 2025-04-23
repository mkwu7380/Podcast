const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();

/**
 * Search for a podcast on Apple Podcasts using iTunes Search API
 * @param {string} podcastName - Name of the podcast to search for
 * @returns {Promise<Object|null>} Podcast data of the first match or null if not found
 */
async function searchPodcast(podcastName) {
  try {
    const encodedPodcastName = encodeURIComponent(podcastName);
    const url = `https://itunes.apple.com/search?term=${encodedPodcastName}&entity=podcast&limit=1`;
    const response = await axios.get(url);
    const results = response.data.results;

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw new Error(`Error searching for podcast: ${error.message}`);
  }
}

/**
 * Fetch episodes from a podcast RSS feed
 * @param {string} feedUrl - URL of the podcast RSS feed
 * @param {number} limit - Number of episodes to fetch
 * @returns {Promise<Array>} Array of episode data
 */
async function fetchEpisodes(feedUrl, limit = 5) {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items.slice(0, limit);
  } catch (error) {
    throw new Error(`Error fetching episodes: ${error.message}`);
  }
}

/**
 * Display podcast information in a formatted way
 * @param {Object} podcast - Podcast data object
 */
function displayPodcastInfo(podcast) {
  console.log('Podcast Found:');
  console.log('Name:', podcast.trackName);
  console.log('Artist:', podcast.artistName);
  console.log('Genre:', podcast.primaryGenreName);
  console.log('Total Episodes:', podcast.trackCount);
  console.log('Feed URL:', podcast.feedUrl);
  console.log('Artwork URL:', podcast.artworkUrl600);
  console.log('Apple Podcasts URL:', podcast.trackViewUrl);
}

/**
 * Display episodes in a formatted way
 * @param {Array} episodes - Array of episode data
 */
function displayEpisodes(episodes) {
  console.log('\nRecent Episodes:');
  episodes.forEach((episode, index) => {
    console.log(`${index + 1}. ${episode.title}`);
    console.log('   Published:', episode.pubDate);
    console.log('   Link:', episode.link);
    console.log('   Audio URL:', episode.enclosure ? episode.enclosure.url : 'N/A');
    console.log('   Description:', episode.contentSnippet ? episode.contentSnippet.slice(0, 100) + (episode.contentSnippet.length > 100 ? '...' : '') : 'N/A');
    console.log('');
  });
}

module.exports = {
  searchPodcast,
  fetchEpisodes,
  displayPodcastInfo,
  displayEpisodes
};
