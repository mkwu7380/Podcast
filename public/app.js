// Hide episodes div initially
const episodesDiv = document.getElementById('episodes');
episodesDiv.style.display = 'none';

async function searchPodcast(page = 1, pageSize = 5) {
  const podcastName = document.getElementById('podcastSearch').value.trim();
  const podcastInfoDiv = document.getElementById('podcastInfo');
  // Show episodes div only when searching
  episodesDiv.style.display = '';
  // Clear previous results
  podcastInfoDiv.innerHTML = '';
  episodesDiv.innerHTML = '';

  if (!podcastName) {
    podcastInfoDiv.innerHTML = '<p class="error">Please enter a podcast name.</p>';
    // Hide episodes div if no podcast name
    episodesDiv.style.display = 'none';
    return;
  }

  try {
    // Show shimmer loading for podcast list
    podcastInfoDiv.innerHTML = '<div class="podcast-list">' + Array(pageSize).fill('<div class="loading-placeholder shimmer"></div>').join('') + '</div>';
    episodesDiv.style.display = 'none';
    // Fetch podcasts
    const searchResponse = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ podcastName, limit: 50 })
    });

    const searchData = await searchResponse.json();

    if (searchResponse.ok) {
      const podcasts = searchData.podcasts;
      if (podcasts.length === 0) {
        podcastInfoDiv.innerHTML = '<p class="error">No podcasts found.</p>';
        // Hide episodes div if no podcasts found
        episodesDiv.style.display = 'none';
        return;
      }
      // Paging logic
      const totalPages = Math.ceil(podcasts.length / pageSize);
      const startIdx = (page - 1) * pageSize;
      const endIdx = startIdx + pageSize;
      const pagedPodcasts = podcasts.slice(startIdx, endIdx);
      // List all podcast names as clickable items
      podcastInfoDiv.innerHTML = '<h2>Select a Podcast</h2>';
      const list = document.createElement('div');
      list.className = 'podcast-list';
      pagedPodcasts.forEach((podcast, idx) => {
        const item = document.createElement('div');
        item.className = 'podcast-list-item';
        item.innerHTML = `
          <div class="podcast-list-artwork"><img src="${podcast.artworkUrl600}" alt="${podcast.trackName}"/></div>
          <div class="podcast-list-info">
            <div class="podcast-list-title">${podcast.trackName}</div>
            <div class="podcast-list-artist">by ${podcast.artistName}</div>
            <div class="podcast-list-genre">${podcast.primaryGenreName}</div>
            <button class="podcast-list-select" data-idx="${startIdx + idx}">Details</button>
          </div>
        `;
        list.appendChild(item);
      });
      podcastInfoDiv.appendChild(list);
      // Paging controls
      const pagingDiv = document.createElement('div');
      pagingDiv.className = 'paging-controls';
      if (page > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.onclick = () => searchPodcast(page - 1, pageSize);
        pagingDiv.appendChild(prevBtn);
      }
      pagingDiv.appendChild(document.createTextNode(` Page ${page} of ${totalPages} `));
      if (page < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.onclick = () => searchPodcast(page + 1, pageSize);
        pagingDiv.appendChild(nextBtn);
      }
      podcastInfoDiv.appendChild(pagingDiv);
      // Hide episodes div until a podcast is selected
      episodesDiv.style.display = 'none';
      // Handle click on a podcast Details button to show details and fetch episodes
      list.addEventListener('click', async (e) => {
        if (e.target.classList.contains('podcast-list-select')) {
          const idx = e.target.getAttribute('data-idx');
          const podcast = podcasts[idx];
          // Back button
          podcastInfoDiv.innerHTML = `
            <button id="backToListBtn" class="back-btn">&larr; Back</button>
            <h2>${podcast.trackName}</h2>
            <img src="${podcast.artworkUrl600}" alt="${podcast.trackName} Artwork">
            <p><strong>Artist:</strong> ${podcast.artistName}</p>
            <p><strong>Genre:</strong> ${podcast.primaryGenreName}</p>
            <p><strong>Total Episodes:</strong> ${podcast.trackCount}</p>
            <p><strong>Apple Podcasts:</strong> <a href="${podcast.trackViewUrl}" target="_blank">View on Apple Podcasts</a></p>
          `;
          document.getElementById('backToListBtn').onclick = () => {
            podcastInfoDiv.innerHTML = '';
            episodesDiv.innerHTML = '';
            episodesDiv.style.display = 'none';
            document.getElementById('podcastSearch').value = '';
          };
          // Add paging for episodes
          let allEpisodes = [];
          let episodePage = 1;
          const episodesPerPage = 5;
          async function fetchAndRenderEpisodes(page) {
            // Add shimmer loading for episodes
            episodesDiv.innerHTML = Array(episodesPerPage).fill('<div class="loading-episode shimmer"></div>').join('');
            episodesDiv.style.display = '';
            if (allEpisodes.length === 0) {
              const episodesResponse = await fetch('/api/episodes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ feedUrl: podcast.feedUrl, limit: 0 })
              });
              const episodesData = await episodesResponse.json();
              if (episodesResponse.ok) {
                allEpisodes = episodesData.episodes || [];
              } else {
                episodesDiv.innerHTML = `<p class=\"error\">${episodesData.error}</p>`;
                episodesDiv.style.display = 'none';
                return;
              }
            }
            episodesDiv.innerHTML = '<h2>Recent Episodes</h2>';
            const totalEpisodePages = Math.ceil(allEpisodes.length / episodesPerPage);
            const startIdx = (page - 1) * episodesPerPage;
            const pagedEpisodes = allEpisodes.slice(startIdx, startIdx + episodesPerPage);
            pagedEpisodes.forEach((episode, index) => {
              const episodeDiv = document.createElement('div');
              episodeDiv.className = 'episode';
              episodeDiv.innerHTML = `
                <h3>${startIdx + index + 1}. ${episode.title}</h3>
                <p><strong>Published:</strong> ${episode.pubDate}</p>
                <p><strong>Description:</strong> ${episode.contentSnippet ? episode.contentSnippet.slice(0, 100) + (episode.contentSnippet.length > 100 ? '...' : '') : 'N/A'}</p>
                <p><strong>Audio:</strong> <a href="${episode.enclosure ? episode.enclosure.url : '#'}" target="_blank">Listen</a></p>
              `;
              episodesDiv.appendChild(episodeDiv);
            });
            // Paging controls for episodes
            const episodePagingDiv = document.createElement('div');
            episodePagingDiv.className = 'paging-controls';
            if (page > 1) {
              const prevBtn = document.createElement('button');
              prevBtn.textContent = 'Previous';
              prevBtn.onclick = () => { fetchAndRenderEpisodes(page - 1); };
              episodePagingDiv.appendChild(prevBtn);
            }
            episodePagingDiv.appendChild(document.createTextNode(` Page ${page} of ${totalEpisodePages} `));
            if (page < totalEpisodePages) {
              const nextBtn = document.createElement('button');
              nextBtn.textContent = 'Next';
              nextBtn.onclick = () => { fetchAndRenderEpisodes(page + 1); };
              episodePagingDiv.appendChild(nextBtn);
            }
            episodesDiv.appendChild(episodePagingDiv);
            episodesDiv.style.display = '';
          }
          if (podcast.feedUrl) {
            fetchAndRenderEpisodes(1);
          } else {
            episodesDiv.innerHTML = '<p class="error">No feed URL available to fetch episodes.</p>';
            episodesDiv.style.display = 'none';
          }
        }
      });
    } else {
      podcastInfoDiv.innerHTML = `<p class="error">${searchData.error}</p>`;
      // Hide episodes div if error
      episodesDiv.style.display = 'none';
    }
  } catch (error) {
    podcastInfoDiv.innerHTML = `<p class="error">Error connecting to the server. Please try again later.</p>`;
    // Hide episodes div if server error
    episodesDiv.style.display = 'none';
    console.error('Error:', error);
  }
}

// Add event listener for Enter key on the input field
document.getElementById('podcastSearch').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    searchPodcast();
  }
});
