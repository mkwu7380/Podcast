import React, { useState, useCallback } from 'react';
import PodcastSearch from '../podcast/PodcastSearch';
import PodcastList from '../podcast/PodcastList';
import { useToast } from '../../utils/toast';
import useAsync from '../../hooks/useAsync';

/**
 * Podcast Search Page Container
 * Manages the search state and renders the search interface and results
 */
const PodcastSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const toast = useToast();
  
  // Mock search function - replace with actual API call
  const searchPodcasts = useCallback(async (query) => {
    if (!query.trim()) return [];
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response - replace with actual API call
    return [
      {
        id: '1',
        title: 'The Daily',
        author: 'The New York Times',
        coverImage: 'https://via.placeholder.com/300x300?text=The+Daily',
        description: 'This is what the news should sound like. The biggest stories of our time, told by the best journalists in the world.',
        isNew: true,
        publishDate: new Date(),
        categories: ['News', 'Daily', 'Politics']
      },
      {
        id: '2',
        title: 'The Joe Rogan Experience',
        author: 'Joe Rogan',
        coverImage: 'https://via.placeholder.com/300x300?text=JRE',
        description: 'The official podcast of comedian Joe Rogan. Follow The Joe Rogan Clips show page for some of the best moments from the episodes.',
        isNew: false,
        publishDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        categories: ['Comedy', 'Talk', 'Interviews']
      },
      {
        id: '3',
        title: 'Stuff You Should Know',
        author: 'iHeartRadio',
        coverImage: 'https://via.placeholder.com/300x300?text=SYSK',
        description: 'If you\'ve ever wanted to know about champagne, satanism, the Stonewall Uprising, chaos theory, LSD, El Nino, true crime and Rosa Parks, then look no further.',
        isNew: false,
        publishDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        categories: ['Education', 'Science', 'History']
      }
    ].filter(podcast => 
      podcast.title.toLowerCase().includes(query.toLowerCase()) ||
      podcast.author.toLowerCase().includes(query.toLowerCase()) ||
      podcast.categories.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
    );
  }, []);
  
  // Use the useAsync hook to manage the search state
  const { 
    execute: executeSearch, 
    data: searchResults = [], 
    isLoading, 
    error 
  } = useAsync(searchPodcasts, {
    onSuccess: (results) => {
      if (results.length === 0) {
        toast.info('No podcasts found matching your search. Try different keywords.');
      } else {
        toast.success(`Found ${results.length} podcast${results.length > 1 ? 's' : ''} matching your search`);
      }
    },
    onError: (err) => {
      console.error('Search error:', err);
      toast.error('Failed to search podcasts. Please try again.');
    }
  });
  
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      toast.warning('Please enter a search term');
      return;
    }
    executeSearch(searchQuery);
  }, [searchQuery, executeSearch, toast]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
<div className="space-y-6">
        <PodcastSearch 
          podcastName={searchQuery}
          setPodcastName={setSearchQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          error={error}
        />
        
        {!isLoading && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No podcasts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We couldn't find any podcasts matching "{searchQuery}". Try different keywords.
            </p>
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Search Results
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found)
              </span>
            </h2>
            <PodcastList 
              podcasts={searchResults} 
              onPodcastSelect={(podcast) => {
                // Handle podcast selection
                toast.success(`Selected ${podcast.title}`);
                // Navigate to podcast details or open modal
              }}
              loading={isLoading}
              error={error}
            />
          </div>
        )}
      </div>
      

    </div>
  );
};

export default PodcastSearchPage;