import React, { useState, useCallback, useEffect } from 'react';

// Simple debounce hook
const useDebounce = (value, delay) => {
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

const ProblemSearch = ({ onProblemSelect, API_BASE_URL }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce search query with 300ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Handle problem completion toggle
  const handleCompleteProblem = useCallback(async (problemId, currentStatus) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    const newStatus = !currentStatus;

    // Optimistic update
    setResults(prev => prev.map(problem => 
      problem.idx === problemId 
        ? { ...problem, isCompleted: newStatus }
        : problem
    ));

    try {
      const response = await fetch(`${API_BASE_URL}/api/complete-problem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ problemId, completed: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Problem completion updated successfully');
      
    } catch (error) {
      console.error('Error updating problem completion:', error);
      // Revert optimistic update on error
      setResults(prev => prev.map(problem => 
        problem.idx === problemId 
          ? { ...problem, isCompleted: currentStatus }
          : problem
      ));
    }
  }, [API_BASE_URL]);

  // Simple search function
  const searchProblems = useCallback(async (query) => {
    const token = localStorage.getItem('token');
    if (!token || !query.trim()) {
      setResults([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        query: query.trim(),
        limit: '8' // Show only 8 suggestions
      });

      const response = await fetch(`${API_BASE_URL}/api/search-problems?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.problems || []);
        setShowSuggestions(query.trim().length > 0 && data.problems.length > 0);
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    searchProblems(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchProblems]);

  // Handle input changes
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!value.trim()) {
      setShowSuggestions(false);
      setResults([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (problem) => {
    setSearchQuery(problem.problem_name);
    setShowSuggestions(false);
    if (onProblemSelect) {
      onProblemSelect(problem);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (searchQuery.trim() && results.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur with delay to allow clicking suggestions
  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
  };

  // Difficulty colors
  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: '#22c55e',
      Medium: '#eab308', 
      Hard: '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  };

  return (
    <div style={{
      position: 'relative',
      maxWidth: '600px',
      margin: '0 auto 2rem auto',
      padding: '0 1rem'
    }}>
      {/* Simple Search Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={(e) => {
            e.target.style.borderColor = '#2563eb';
            e.target.style.boxShadow = '0 4px 12px rgba(37,99,235,0.15)';
            handleFocus();
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            handleBlur();
          }}
          placeholder="🔍 Search problems by name or ID..."
          style={{
            width: '100%',
            padding: '1rem 1.5rem',
            fontSize: '1rem',
            border: '2px solid #e5e7eb',
            borderRadius: '0.75rem',
            outline: 'none',
            background: '#fff',
            color: '#000',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease'
          }}
        />
        
        {/* Loading indicator */}
        {loading && (
          <div style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#2563eb',
            fontSize: '0.9rem'
          }}>
            🔄
          </div>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '1rem',
          right: '1rem',
          background: '#fff',
          border: '2px solid #e5e7eb',
          borderTop: 'none',
          borderRadius: '0 0 0.75rem 0.75rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {results.map((problem, index) => (
            <div
              key={`${problem.idx}-${index}`}
              style={{
                padding: '1rem 1.5rem',
                borderBottom: index < results.length - 1 ? '1px solid #f3f4f6' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'background-color 0.2s',
                color: '#000'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Completion Status */}
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: problem.isCompleted ? '#22c55e' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {problem.isCompleted ? '✓' : ''}
              </div>

              {/* Problem ID */}
              <div style={{
                minWidth: '50px',
                fontWeight: 600,
                color: '#6b7280',
                fontSize: '0.9rem'
              }}>
                #{problem.idx}
              </div>

              {/* Problem Name - Clickable */}
              <div 
                onClick={() => handleSuggestionSelect(problem)}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  flex: 1,
                  fontWeight: 500,
                  color: '#111827',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  padding: '0.5rem 0'
                }}
              >
                {problem.problem_name}
              </div>

              {/* Completion Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCompleteProblem(problem.idx, problem.isCompleted);
                }}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: problem.isCompleted ? '#dc2626' : '#16a34a',
                  color: 'white',
                  minWidth: '80px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = problem.isCompleted ? '#b91c1c' : '#15803d';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = problem.isCompleted ? '#dc2626' : '#16a34a';
                }}
              >
                {problem.isCompleted ? 'Completed' : 'Complete'}
              </button>

              {/* Difficulty Badge */}
              <div style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'white',
                background: getDifficultyColor(problem.difficulty),
                minWidth: '60px',
                textAlign: 'center'
              }}>
                {problem.difficulty}
              </div>
            </div>
          ))}
          
          {/* Show more indicator */}
          {results.length === 8 && (
            <div style={{
              padding: '0.75rem 1.5rem',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '0.85rem',
              borderTop: '1px solid #f3f4f6',
              background: '#f9fafb'
            }}>
              Type more to see additional results...
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {!loading && searchQuery.trim() && results.length === 0 && debouncedSearchQuery === searchQuery && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '1rem',
          right: '1rem',
          background: '#fff',
          border: '2px solid #e5e7eb',
          borderTop: 'none',
          borderRadius: '0 0 0.75rem 0.75rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          padding: '2rem',
          textAlign: 'center',
          color: '#6b7280',
          zIndex: 1000
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
          <div style={{ fontSize: '0.9rem' }}>No problems found matching "{searchQuery}"</div>
        </div>
      )}
    </div>
  );
};

export default ProblemSearch;
