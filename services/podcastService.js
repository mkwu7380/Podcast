const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();

/**
 * Search for a podcast on Apple Podcasts using iTunes Search API
 * @param {string} podcastName - Name of the podcast to search for
 * @param {number} [limit=10] - Maximum number of podcasts to return
 * @returns {Promise<Array>} Array of podcast data objects
 */
async function searchPodcast(podcastName, limit = 10) {
  try {
    const encodedPodcastName = encodeURIComponent(podcastName);
    const url = `https://itunes.apple.com/search?term=${encodedPodcastName}&entity=podcast&limit=${limit}`;
    const response = await axios.get(url);
    const results = response.data.results;

    return results;
  } catch (error) {
    throw new Error(`Error searching for podcast: ${error.message}`);
  }
}

/**
 * Fetch episodes from a podcast RSS feed
 * @param {string} feedUrl - URL of the podcast RSS feed
 * @param {number} limit - Number of episodes to fetch (0 means all)
 * @returns {Promise<Array>} Array of episode data
 */
async function fetchEpisodes(feedUrl, limit = 0) {
  try {
    const feed = await parser.parseURL(feedUrl);
    if (limit && limit > 0) {
      return feed.items.slice(0, limit);
    } else {
      return feed.items;
    }
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
