import React from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/layout/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';

/**
 * Podcast List Item Component
 */
const PodcastListItem = ({ podcast, onSelect }) => {
  return (
    <Card hoverable className="overflow-hidden">
      <div className="md:flex">
        <div className="md:flex-shrink-0">
          <img 
            className="h-48 w-full object-cover md:w-48" 
            src={podcast.coverImage || 'https://via.placeholder.com/300x300?text=No+Cover'} 
            alt={podcast.title}
          />
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {podcast.title}
              </h3>
              {podcast.isNew && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  New
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {podcast.author}
            </p>
            {podcast.publishDate && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Published: {formatDate(podcast.publishDate)}
              </p>
            )}
            {podcast.duration && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Duration: {podcast.duration}
              </p>
            )}
            {podcast.description && (
              <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                {podcast.description}
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex space-x-2">
              {podcast.categories?.map((category) => (
                <span 
                  key={category} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {category}
                </span>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSelect(podcast)}
              className="ml-2"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * Podcast List Component
 */
const PodcastList = ({ podcasts, onPodcastSelect, loading, error, emptyMessage }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-2">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          Error loading podcasts
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {error.message || 'Failed to load podcast list. Please try again.'}
        </p>
        <div className="mt-4">
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!podcasts || podcasts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          No podcasts found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {emptyMessage || 'Try adjusting your search or filter to find what you\'re looking for.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {podcasts.map((podcast) => (
        <PodcastListItem 
          key={podcast.id} 
          podcast={podcast} 
          onSelect={onPodcastSelect} 
        />
      ))}
    </div>
  );
};

PodcastList.propTypes = {
  podcasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      author: PropTypes.string,
      coverImage: PropTypes.string,
      description: PropTypes.string,
      publishDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      duration: PropTypes.string,
      categories: PropTypes.arrayOf(PropTypes.string),
      isNew: PropTypes.bool,
    })
  ),
  onPodcastSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  emptyMessage: PropTypes.string,
};

PodcastList.defaultProps = {
  loading: false,
  error: null,
  emptyMessage: '',
};

export default PodcastList;
