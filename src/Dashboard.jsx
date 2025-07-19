import React, { useState, useEffect, useCallback, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import './calendar-black.css';

// Helper to fetch and parse the problems file
const useProblems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch("/striver_problems.txt");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const lines = text.trim().split("\n").slice(1); // skip header
        const parsed = lines.map(line => {
          // Split by comma, but handle quoted names with commas
          const match = line.match(/^(\d+),"?([^"]+?)"?,(Easy|Medium|Hard)$/);
          if (match) {
            return {
              idx: parseInt(match[1], 10),
              problem_name: match[2],
              difficulty: match[3],
            };
          } else {
            // fallback for lines without quotes
            const [idx, problem_name, difficulty] = line.split(",");
            return { 
              idx: parseInt(idx, 10), 
              problem_name, 
              difficulty 
            };
          }
        }).filter(problem => problem.idx && problem.problem_name && problem.difficulty);
        setProblems(parsed);
      } catch (err) {
        console.error('Error fetching problems:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  return { problems, loading, error };
};

const difficultyColor = (diff) => {
  const colors = {
    Easy: "#22c55e",    // Green
    Medium: "#eab308",  // Yellow  
    Hard: "#ef4444"     // Red
  };
  return colors[diff] || "#6b7280";
};

const seededShuffle = (array, seed) => {
  // Simple LCG for deterministic shuffling
  let m = 0x80000000, a = 1103515245, c = 12345;
  let state = seed;
  const rand = () => (state = (a * state + c) % m) / m;
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getSeedFromDate = (date) => {
  // YYYYMMDD as integer
  if (!(date instanceof Date)) date = new Date(date);
  return parseInt(
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  );
};

const Dashboard = () => {
  const { problems, loading, error } = useProblems();
  const [date, setDate] = useState(new Date());
  const [completed, setCompleted] = useState([]);
  const [todaysProblems, setTodaysProblems] = useState([]);
  const [showSolved, setShowSolved] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Memoize API base URL
  const API_BASE_URL = useMemo(() => 
    import.meta.env.VITE_API_BASE_URL || 'https://striver-pod-backend-3.onrender.com', 
  []);

  // Store locked questions per date in localStorage
  useEffect(() => {
    const fetchCompletedProblems = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/completed-problems`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setCompleted(data.completedProblems || []);
        setApiError(null);
      } catch (err) {
        console.error('Error fetching completed problems:', err);
        setApiError('Failed to fetch completed problems');
      }
    };

    fetchCompletedProblems();
  }, [API_BASE_URL]);

  // Generate daily POD questions - 10 UNSOLVED problems per day, locked to specific dates
  useEffect(() => {
    if (!problems.length) return;
    
    const today = new Date();
    const selectedDate = new Date(date);
    const dateKey = selectedDate.toISOString().slice(0, 10);
    
    // Don't allow future dates beyond today
    if (selectedDate > today) {
      setTodaysProblems([]);
      return;
    }
    
    // Get or create locked questions for this specific date
    let lockedQuestions = JSON.parse(localStorage.getItem('dailyPOD') || '{}');
    
    // Filter out completed problems from existing daily problems
    if (lockedQuestions[dateKey]) {
      const existingProblems = lockedQuestions[dateKey];
      const unsolvedExisting = existingProblems.filter(id => !completed.includes(id));
      
      // If we have fewer than 10 unsolved problems, generate new ones
      if (unsolvedExisting.length < 10) {
        // Get all unsolved problems
        const unsolvedProblems = problems.filter(p => !completed.includes(p.idx));
        
        if (unsolvedProblems.length > 0) {
          // Generate seed for this date to ensure consistency
          const seed = getSeedFromDate(selectedDate);
          const shuffled = seededShuffle(unsolvedProblems, seed);
          
          // Take problems to fill up to 10, avoiding duplicates
          const existingIds = new Set(unsolvedExisting);
          const newProblems = [];
          
          for (const problem of shuffled) {
            if (!existingIds.has(problem.idx) && newProblems.length + unsolvedExisting.length < 10) {
              newProblems.push(problem.idx);
              existingIds.add(problem.idx);
            }
          }
          
          // Update the daily problems with unsolved ones
          lockedQuestions[dateKey] = [...unsolvedExisting, ...newProblems];
        } else {
          // No unsolved problems available
          lockedQuestions[dateKey] = unsolvedExisting;
        }
        
        // Save to localStorage and sync with server
        localStorage.setItem('dailyPOD', JSON.stringify(lockedQuestions));
        syncDailyPODToServer(lockedQuestions);
      } else {
        // We have enough unsolved problems, just update the stored data
        lockedQuestions[dateKey] = unsolvedExisting;
        localStorage.setItem('dailyPOD', JSON.stringify(lockedQuestions));
        syncDailyPODToServer(lockedQuestions);
      }
    } else {
      // Generate fresh 10 unsolved problems for this date
      const unsolvedProblems = problems.filter(p => !completed.includes(p.idx));
      
      if (unsolvedProblems.length > 0) {
        const seed = getSeedFromDate(selectedDate);
        const shuffled = seededShuffle(unsolvedProblems, seed);
        
        // Take up to 10 problems (or all available if less than 10)
        const selectedProblems = shuffled.slice(0, Math.min(10, unsolvedProblems.length));
        lockedQuestions[dateKey] = selectedProblems.map(p => p.idx);
        
        // Save to localStorage and sync with server
        localStorage.setItem('dailyPOD', JSON.stringify(lockedQuestions));
        syncDailyPODToServer(lockedQuestions);
      } else {
        // No unsolved problems available
        lockedQuestions[dateKey] = [];
        localStorage.setItem('dailyPOD', JSON.stringify(lockedQuestions));
      }
    }
    
    // Get the final problems for this date (all should be unsolved)
    const dailyProblemIds = lockedQuestions[dateKey] || [];
    const dailyProblems = dailyProblemIds
      .map(id => problems.find(p => p.idx === id))
      .filter(Boolean)
      .filter(p => !completed.includes(p.idx)); // Double check - only show unsolved
    
    // Debug logging
    console.log(`POD for ${dateKey}: ${dailyProblems.length} unsolved problems`, {
      totalAvailable: problems.length,
      totalCompleted: completed.length,
      unsolvedCount: problems.filter(p => !completed.includes(p.idx)).length,
      todaysProblems: dailyProblems.map(p => ({ id: p.idx, name: p.name, solved: completed.includes(p.idx) }))
    });
    
    setTodaysProblems(dailyProblems);
  }, [date, problems, completed]); // Added completed as dependency

  // Sync daily POD to server
  const syncDailyPODToServer = async (dailyPODData) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/save-daily-pod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ dailyPOD: dailyPODData })
      });
    } catch (error) {
      console.error('Error syncing daily POD to server:', error);
    }
  };

  // Enhanced problem completion handler with better error handling
  const handleCheck = useCallback(async (problemId, checked) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setApiError('No authentication token found');
      return;
    }

    // Optimistic update
    setCompleted(prev =>
      checked ? [...prev, problemId] : prev.filter(id => id !== problemId)
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/complete-problem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ problemId, completed: checked })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCompleted(data.completedProblems || []);
      setApiError(null);
      
      // Clean up future POD data to ensure fresh unsolved problems
      if (checked) {
        cleanupFuturePODData(problemId);
      }
    } catch (error) {
      console.error('Error updating problem completion:', error);
      setApiError('Failed to update problem completion');
      // Revert optimistic update on error
      setCompleted(prev =>
        checked ? prev.filter(id => id !== problemId) : [...prev, problemId]
      );
    }
  }, [API_BASE_URL]);

  // Clean up future POD data when a problem is completed
  const cleanupFuturePODData = (completedProblemId) => {
    const today = new Date();
    let lockedQuestions = JSON.parse(localStorage.getItem('dailyPOD') || '{}');
    let updated = false;
    
    // Remove completed problem from ALL dates (past and future)
    Object.keys(lockedQuestions).forEach(dateKey => {
      const problems = lockedQuestions[dateKey];
      if (problems.includes(completedProblemId)) {
        lockedQuestions[dateKey] = problems.filter(id => id !== completedProblemId);
        updated = true;
        console.log(`Removed completed problem ${completedProblemId} from date ${dateKey}`);
      }
    });
    
    if (updated) {
      localStorage.setItem('dailyPOD', JSON.stringify(lockedQuestions));
      syncDailyPODToServer(lockedQuestions);
      console.log('POD data cleaned up after problem completion');
    }
  };

  // Regenerate POD data to ensure only unsolved problems appear
  const regeneratePODForDate = (targetDate, unsolvedProblems) => {
    const dateKey = targetDate.toISOString().slice(0, 10);
    const seed = getSeedFromDate(targetDate);
    const shuffled = seededShuffle(unsolvedProblems, seed);
    return shuffled.slice(0, Math.min(10, unsolvedProblems.length)).map(p => p.idx);
  };

  // Check if selected date is in the future
  const isDateInFuture = useMemo(() => {
    const today = new Date();
    const selectedDate = new Date(date);
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate > today;
  }, [date]);

  // Get completion stats for current date
  const completionStats = useMemo(() => {
    const completedToday = todaysProblems.filter(p => completed.includes(p.idx)).length;
    return {
      completed: completedToday,
      total: todaysProblems.length,
      percentage: todaysProblems.length > 0 ? Math.round((completedToday / todaysProblems.length) * 100) : 0
    };
  }, [todaysProblems, completed]);

  // Memoize filtered problems for performance
  const filteredProblems = useMemo(() => {
    if (showAll) return problems;
    if (showSolved) return problems.filter(p => completed.includes(p.idx));
    return todaysProblems;
  }, [problems, completed, todaysProblems, showAll, showSolved]);
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fa"
      }}>
        <div style={{ textAlign: "center", color: "#2563eb" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📚</div>
          <div>Loading problems...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fa"
      }}>
        <div style={{ textAlign: "center", color: "#ef4444" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
          <div>Error loading problems: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      background: "#f5f7fa",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* API Error Display */}
      {apiError && (
        <div style={{
          background: "#fef2f2",
          color: "#dc2626",
          padding: "1rem",
          textAlign: "center",
          border: "1px solid #fca5a5"
        }}>
          ⚠️ {apiError}
        </div>
      )}
      
      {/* Main Content */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: "2.5rem",
        justifyContent: "center",
        alignItems: "flex-start",
        width: "100%",
        minHeight: "80vh",
        padding: "2rem 0"
      }}>
        {/* Problems Table */}
        <div style={{
          flex: 2,
          background: "#fff",
          borderRadius: "1.2rem",
          boxShadow: "0 4px 24px rgba(37,99,235,0.10)",
          padding: "2rem 1.5rem",
          maxHeight: "70vh",
          overflowY: "auto",
          minWidth: 0,
          color: "#000"
        }}>
          {/* Real-time stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: '2rem',
            marginBottom: '1.2rem',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#2563eb',
          }}>
            <span
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setShowAll(true)}
            >
              All Available Problems: {problems.length}
            </span>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowSolved(true)}>
              Solved: {completed.length}
            </span>
            <span style={{ color: '#16a34a' }}>
              Remaining: {problems.length - completed.length}
            </span>
            {(showSolved || showAll) && (
              <button style={{ marginLeft: '1rem', fontWeight: 500, fontSize: '1rem', color: '#2563eb', background: 'none', border: '1px solid #2563eb', borderRadius: '0.7rem', padding: '0.3rem 1rem', cursor: 'pointer' }} onClick={() => { setShowSolved(false); setShowAll(false); }}>
                Back to Daily
              </button>
            )}
          </div>
          <h2 style={{ color: "#2563eb", marginBottom: "1.2rem", fontWeight: 800 }}>
            {showAll ? 'All Problems' : showSolved ? 'Solved Problems' : `Daily POD - ${date.toDateString()}`}
          </h2>
          
          {/* Show daily progress */}
          {!showAll && !showSolved && (
            <div style={{
              background: "#f0f9ff",
              border: "1px solid #0284c7",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem"
            }}>
              <div style={{ 
                background: "#0284c7", 
                color: "white", 
                borderRadius: "50%", 
                width: "3rem", 
                height: "3rem", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}>
                {completionStats.percentage}%
              </div>
              <div>
                <div style={{ fontWeight: "bold", color: "#0284c7", fontSize: "1.1rem" }}>
                  Progress: {completionStats.completed}/{completionStats.total} completed
                </div>
                <div style={{ color: "#475569", fontSize: "0.9rem" }}>
                  {completionStats.completed === completionStats.total ? 
                    "🎉 All problems completed for today!" : 
                    `${completionStats.total - completionStats.completed} problems remaining`
                  }
                </div>
              </div>
            </div>
          )}
          
          {/* Show message when trying to access future date */}
          {!showAll && !showSolved && isDateInFuture && (
            <div style={{
              background: "#fef3c7",
              border: "1px solid #f59e0b",
              color: "#92400e",
              padding: "2rem",
              borderRadius: "0.7rem",
              textAlign: "center",
              margin: "2rem 0"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔒</div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem" }}>Future Date</h3>
              <p style={{ margin: 0, fontSize: "1rem" }}>
                You can't access future problems! Come back on {date.toDateString()} to see today's POD.
              </p>
            </div>
          )}
          
          {/* Show problems table only if not future date */}
          {(!isDateInFuture || showAll || showSolved) && (
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#000" }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ padding: "0.7rem", textAlign: "left", color: "#000" }}>Done</th>
                  <th style={{ padding: "0.7rem", textAlign: "left", color: "#000" }}>ID</th>
                  <th style={{ padding: "0.7rem", textAlign: "left", color: "#000" }}>Problem Name</th>
                  <th style={{ padding: "0.7rem", textAlign: "left", color: "#000" }}>Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.map((p, i) => (
                  <tr key={`${p.idx}-${i}`} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={completed.includes(p.idx)}
                        onChange={e => handleCheck(p.idx, e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: "0.6rem 0.7rem", fontWeight: 500, color: "#000" }}>{p.idx}</td>
                    <td style={{ padding: "0.6rem 0.7rem", color: "#000" }}>{p.problem_name}</td>
                    <td style={{ padding: "0.6rem 0.7rem", color: difficultyColor(p.difficulty), fontWeight: 700 }}>{p.difficulty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Calendar */}
        <div style={{
          flex: 1,
          background: "#fff",
          borderRadius: "1.2rem",
          boxShadow: "0 4px 24px rgba(37,99,235,0.10)",
          padding: "2rem 1.5rem",
          minWidth: 320,
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "#000"
        }}>
          <h2 style={{ color: "#2563eb", marginBottom: "1.2rem", fontWeight: 800 }}>Calendar</h2>
          
          {/* Calendar Legend */}
          <div style={{ 
            marginBottom: "1rem", 
            fontSize: "0.8rem", 
            color: "#475569",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <div style={{ width: "12px", height: "12px", background: "#22c55e", borderRadius: "50%" }}></div>
              <span>Easy</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <div style={{ width: "12px", height: "12px", background: "#eab308", borderRadius: "50%" }}></div>
              <span>Medium</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "50%" }}></div>
              <span>Hard</span>
            </div>
          </div>
          
          <div style={{ background: "#f1f5f9", borderRadius: "1rem", padding: "1rem" }}>
            <Calendar
              onChange={setDate}
              value={date}
              calendarType="gregory"
              selectRange={false}
              tileClassName={({ date: d }) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                d.setHours(0, 0, 0, 0);
                
                if (d.toDateString() === date.toDateString()) {
                  return 'calendar-black-text';
                }
                if (d > today) {
                  return 'calendar-future-date';
                }
                return null;
              }}
              tileDisabled={({ date: d }) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                d.setHours(0, 0, 0, 0);
                return d > today;
              }}
              prevLabel={<span style={{ color: "#2563eb", fontWeight: 700 }}>{"<"}</span>}
              nextLabel={<span style={{ color: "#2563eb", fontWeight: 700 }}>{">"}</span>}
              next2Label={null}
              prev2Label={null}
              className="calendar-black-text"
            />
          </div>
          <div style={{ marginTop: "1.2rem", color: "#475569", textAlign: "center" }}>
            <div>Selected: {date.toDateString()}</div>
            {isDateInFuture && (
              <div style={{ color: "#f59e0b", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                ⚠️ Future date - Problems not available yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 