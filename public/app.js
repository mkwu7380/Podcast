async function searchPodcast() {
  const podcastName = document.getElementById('podcastSearch').value.trim();
  const podcastInfoDiv = document.getElementById('podcastInfo');
  const episodesDiv = document.getElementById('episodes');

  // Clear previous results
  podcastInfoDiv.innerHTML = '';
  episodesDiv.innerHTML = '';

  if (!podcastName) {
    podcastInfoDiv.innerHTML = '<p class="error">Please enter a podcast name.</p>';
    return;
  }

  try {
    // Search for the podcast
    const searchResponse = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ podcastName })
    });

    const searchData = await searchResponse.json();

    if (searchResponse.ok) {
      const podcast = searchData.podcast;
      podcastInfoDiv.innerHTML = `
        <h2>${podcast.trackName}</h2>
        <img src="${podcast.artworkUrl600}" alt="${podcast.trackName} Artwork">
        <p><strong>Artist:</strong> ${podcast.artistName}</p>
        <p><strong>Genre:</strong> ${podcast.primaryGenreName}</p>
        <p><strong>Total Episodes:</strong> ${podcast.trackCount}</p>
        <p><strong>Apple Podcasts:</strong> <a href="${podcast.trackViewUrl}" target="_blank">View on Apple Podcasts</a></p>
      `;

      // Fetch episodes if feed URL is available
      if (podcast.feedUrl) {
        const episodesResponse = await fetch('/api/episodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ feedUrl: podcast.feedUrl })
        });

        const episodesData = await episodesResponse.json();

        if (episodesResponse.ok) {
          episodesDiv.innerHTML = '<h2>Recent Episodes</h2>';
          episodesData.episodes.forEach((episode, index) => {
            const episodeDiv = document.createElement('div');
            episodeDiv.className = 'episode';
            episodeDiv.innerHTML = `
              <h3>${index + 1}. ${episode.title}</h3>
              <p><strong>Published:</strong> ${episode.pubDate}</p>
              <p><strong>Description:</strong> ${episode.contentSnippet ? episode.contentSnippet.slice(0, 100) + (episode.contentSnippet.length > 100 ? '...' : '') : 'N/A'}</p>
              <p><strong>Audio:</strong> <a href="${episode.enclosure ? episode.enclosure.url : '#'}" target="_blank">Listen</a></p>
            `;
            episodesDiv.appendChild(episodeDiv);
          });
        } else {
          episodesDiv.innerHTML = `<p class="error">${episodesData.error}</p>`;
        }
      } else {
        episodesDiv.innerHTML = '<p class="error">No feed URL available to fetch episodes.</p>';
      }
    } else {
      podcastInfoDiv.innerHTML = `<p class="error">${searchData.error}</p>`;
    }
  } catch (error) {
    podcastInfoDiv.innerHTML = `<p class="error">Error connecting to the server. Please try again later.</p>`;
    console.error('Error:', error);
  }
}

// Add event listener for Enter key on the input field
document.getElementById('podcastSearch').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    searchPodcast();
  }
});
