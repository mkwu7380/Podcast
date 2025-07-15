import React, { useState } from 'react';
import Input from '../ui/form/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/feedback/LoadingSpinner';
import Card from '../ui/layout/Card';

/**
 * Modern Podcast Search Component
 * Features improved UX, better form design, and responsive layout
 */
const PodcastSearch = ({ 
  podcastName, 
  setPodcastName, 
  onSearch, 
  isLoading, 
  error 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading && podcastName.trim()) {
      onSearch();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && podcastName.trim()) {
      e.preventDefault();
      onSearch();
    }
  };

  const handleClear = () => {
    setPodcastName('');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Discover Podcasts
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Search for your favorite podcasts from millions of shows available. 
          Find episodes, get transcriptions, and discover new content.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label 
              htmlFor="podcast-search" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Search for a podcast
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  id="podcast-search"
                  type="text"
                  value={podcastName}
                  onChange={(e) => setPodcastName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Enter podcast name, host, or network..."
                  disabled={isLoading}
                  startAdornment={
                    <span className="text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                  }
                />
              </div>
              <Button 
                type="submit" 
                variant="primary"
                loading={isLoading}
                disabled={!podcastName.trim()}
                className="whitespace-nowrap"
              >
                Search
              </Button>
            </div>
            
            {podcastName && (
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Press Enter to search
                </p>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>

          {podcastName && isFocused && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50 text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tip: Try being specific with podcast names for better results. Include the host's name or network if you know it.</span>
              </p>
            </div>
          )}
        </form>
      </Card>

      {isLoading && (
        <div className="text-center py-8 space-y-4">
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Searching for "{podcastName}"...
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Searching through millions of podcasts. This may take a moment.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/50">
          <p className="text-red-700 dark:text-red-300 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error.message || 'An error occurred while searching. Please try again.'}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default PodcastSearch;
