import { useState, useCallback } from 'react';

/**
 * Custom hook to handle async operations with loading and error states
 * @param {Function} asyncFunction - The async function to be executed
 * @param {Object} options - Configuration options
 * @param {boolean} options.throwOnError - Whether to throw errors or return them
 * @param {Function} options.onSuccess - Callback for successful execution
 * @param {Function} options.onError - Callback for error handling
 * @returns {Object} - Async state and methods
 */
const useAsync = (asyncFunction, options = {}) => {
  const { 
    throwOnError = false, 
    onSuccess, 
    onError 
  } = options;
  
  const [status, setStatus] = useState('idle'); // 'idle' | 'pending' | 'success' | 'error'
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setStatus('pending');
    setError(null);
    
    try {
      const result = await asyncFunction(...args);
      setData(result);
      setStatus('success');
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return { data: result, error: null };
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setStatus('error');
      
      if (onError) {
        onError(errorObj);
      }
      
      if (throwOnError) {
        throw errorObj;
      }
      
      return { data: null, error: errorObj };
    }
  }, [asyncFunction, onSuccess, onError, throwOnError]);

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  return {
    // Status booleans
    isIdle: status === 'idle',
    isLoading: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    
    // Current state
    status,
    data,
    error,
    
    // Methods
    execute,
    reset,
    setData,
    setError,
  };
};

export default useAsync;
