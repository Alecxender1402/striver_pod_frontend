import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for debounced search with advanced features
 * @param {Function} searchFunction - Function to execute the search
 * @param {number} delay - Debounce delay in milliseconds
 * @param {Array} dependencies - Additional dependencies to watch
 */
export const useDebounceSearch = (searchFunction, delay = 500, dependencies = []) => {
  const [searchState, setSearchState] = useState({
    loading: false,
    error: null,
    hasSearched: false
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const searchCountRef = useRef(0);

  // Debounced search effect
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      const currentSearchId = ++searchCountRef.current;
      
      // Don't search if query is empty and no filters
      if (!searchQuery.trim() && Object.keys(filters).length === 0) {
        setSearchState({
          loading: false,
          error: null,
          hasSearched: false
        });
        return;
      }

      setSearchState(prev => ({
        ...prev,
        loading: true,
        error: null,
        hasSearched: true
      }));

      try {
        // Create new abort controller for this search
        abortControllerRef.current = new AbortController();
        
        await searchFunction(searchQuery, filters, abortControllerRef.current.signal);
        
        // Only update state if this is still the latest search
        if (currentSearchId === searchCountRef.current) {
          setSearchState(prev => ({
            ...prev,
            loading: false,
            error: null
          }));
        }
      } catch (error) {
        // Only update state if this is still the latest search and not aborted
        if (currentSearchId === searchCountRef.current && error.name !== 'AbortError') {
          setSearchState(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Search failed'
          }));
        }
      }
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, filters, delay, searchFunction, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update search query
  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters({});
    setSearchState({
      loading: false,
      error: null,
      hasSearched: false
    });
    
    // Cancel any pending search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    searchQuery,
    filters,
    searchState,
    updateSearchQuery,
    updateFilters,
    clearSearch
  };
};

/**
 * Simple debounce hook for individual values
 * @param {any} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for managing search history and suggestions
 * @param {string} storageKey - Local storage key for search history
 * @param {number} maxHistory - Maximum number of history items to store
 */
export const useSearchHistory = (storageKey = 'search-history', maxHistory = 10) => {
  const [searchHistory, setSearchHistory] = useState([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const history = JSON.parse(stored);
        setSearchHistory(Array.isArray(history) ? history : []);
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, [storageKey]);

  // Add search to history
  const addToHistory = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return;

    setSearchHistory(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => 
        item.toLowerCase() !== searchTerm.toLowerCase()
      );
      
      // Add to beginning and limit size
      const newHistory = [searchTerm, ...filtered].slice(0, maxHistory);
      
      // Save to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(newHistory));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }
      
      return newHistory;
    });
  }, [maxHistory, storageKey]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }, [storageKey]);

  // Remove specific item from history
  const removeFromHistory = useCallback((searchTerm) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => 
        item.toLowerCase() !== searchTerm.toLowerCase()
      );
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(newHistory));
      } catch (error) {
        console.warn('Failed to update search history:', error);
      }
      
      return newHistory;
    });
  }, [storageKey]);

  return {
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory
  };
};

export default {
  useDebounceSearch,
  useDebounce,
  useSearchHistory
};
