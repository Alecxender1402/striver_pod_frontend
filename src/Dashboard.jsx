import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import './calendar-black.css';

// Helper to fetch and parse the problems file
const useProblems = () => {
  const [problems, setProblems] = useState([]);
  useEffect(() => {
    fetch("/striver_problems.txt")
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split("\n").slice(1); // skip header
        const parsed = lines.map(line => {
          // Split by comma, but handle quoted names with commas
          const match = line.match(/^(\d+),"?([^"]+?)"?,(Easy|Medium|Hard)$/);
          if (match) {
            return {
              idx: match[1],
              problem_name: match[2],
              difficulty: match[3],
            };
          } else {
            // fallback for lines without quotes
            const [idx, problem_name, difficulty] = line.split(",");
            return { idx, problem_name, difficulty };
          }
        });
        setProblems(parsed);
      });
  }, []);
  return problems;
};

const difficultyColor = diff =>
  diff === "Easy"
    ? "#22c55e"
    : diff === "Medium"
    ? "#f59e42"
    : "#ef4444";

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
  const problems = useProblems();
  const [date, setDate] = useState(new Date());
  const [completed, setCompleted] = useState([]);
  const [todaysProblems, setTodaysProblems] = useState([]);
  const [showSolved, setShowSolved] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Store locked questions per date in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('https://striver-pod-backend-3.onrender.com/api/completed-problems', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCompleted(data.completedProblems || []));
  }, []);

  // Lock 20 questions for a date, store in localStorage, and always use the same set for that date
  useEffect(() => {
    if (!problems.length) return;
    const dateKey = date instanceof Date ? date.toISOString().slice(0, 10) : new Date(date).toISOString().slice(0, 10);
    let locked = JSON.parse(localStorage.getItem('lockedQuestions') || '{}');
    if (!locked[dateKey]) {
      // Only use uncompleted problems at the time of date selection
      const uncompletedProblems = problems.filter(
        p => !completed.includes(Number(p.idx))
      );
      const seed = getSeedFromDate(date);
      locked[dateKey] = seededShuffle(uncompletedProblems, seed).slice(0, 20).map(p => p.idx);
      localStorage.setItem('lockedQuestions', JSON.stringify(locked));
    }
    // Always use the locked set for this date
    setTodaysProblems(
      locked[dateKey]
        .map(idx => problems.find(p => String(p.idx) === String(idx)))
        .filter(Boolean)
    );
    // eslint-disable-next-line
  }, [date, problems]);

  const handleCheck = async (problemId, checked) => {
    const token = localStorage.getItem('token');
    setCompleted(prev =>
      checked ? [...prev, problemId] : prev.filter(id => id !== problemId)
    );
    await fetch('https://striver-pod-backend-3.onrender.com/api/complete-problem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ problemId, completed: checked })
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      background: "#f5f7fa",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Top Bar */}
      {/* <div style={{
        width: "100%",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(37,99,235,0.10)",
        padding: "1.2rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopLeftRadius: "0 0 1.2rem 1.2rem",
        borderTopRightRadius: "0 0 1.2rem 1.2rem"
      }}>
        <h1 style={{ color: "#2563eb", fontWeight: 900, fontSize: "2rem", margin: 0, letterSpacing: "-1px" }}>
          Dashboard
        </h1>
        <span style={{ color: "#2563eb", fontWeight: 700, fontSize: "1.1rem" }}>
          Striver A2Z DSA Pod
        </span>
      </div> */}
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
            {(showSolved || showAll) && (
              <button style={{ marginLeft: '1rem', fontWeight: 500, fontSize: '1rem', color: '#2563eb', background: 'none', border: '1px solid #2563eb', borderRadius: '0.7rem', padding: '0.3rem 1rem', cursor: 'pointer' }} onClick={() => { setShowSolved(false); setShowAll(false); }}>
                Back to Daily
              </button>
            )}
          </div>
          <h2 style={{ color: "#2563eb", marginBottom: "1.2rem", fontWeight: 800 }}>Striver A2Z DSA Problems</h2>
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
              {showAll
                ? problems.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={completed.includes(Number(p.idx))}
                          onChange={e => handleCheck(Number(p.idx), e.target.checked)}
                        />
                      </td>
                      <td style={{ padding: "0.6rem 0.7rem", fontWeight: 500, color: "#000" }}>{p.idx}</td>
                      <td style={{ padding: "0.6rem 0.7rem", color: "#000" }}>{p.problem_name}</td>
                      <td style={{ padding: "0.6rem 0.7rem", color: difficultyColor(p.difficulty), fontWeight: 700 }}>{p.difficulty}</td>
                    </tr>
                  ))
                : showSolved
                ? problems.filter(p => completed.includes(Number(p.idx))).map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={e => handleCheck(Number(p.idx), e.target.checked)}
                        />
                      </td>
                      <td style={{ padding: "0.6rem 0.7rem", fontWeight: 500, color: "#000" }}>{p.idx}</td>
                      <td style={{ padding: "0.6rem 0.7rem", color: "#000" }}>{p.problem_name}</td>
                      <td style={{ padding: "0.6rem 0.7rem", color: difficultyColor(p.difficulty), fontWeight: 700 }}>{p.difficulty}</td>
                    </tr>
                  ))
                : todaysProblems.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={completed.includes(Number(p.idx))}
                          onChange={e => handleCheck(Number(p.idx), e.target.checked)}
                        />
                      </td>
                      <td style={{ padding: "0.6rem 0.7rem", fontWeight: 500, color: "#000" }}>{p.idx}</td>
                      <td style={{ padding: "0.6rem 0.7rem", color: "#000" }}>{p.problem_name}</td>
                      <td style={{ padding: "0.6rem 0.7rem", color: difficultyColor(p.difficulty), fontWeight: 700 }}>{p.difficulty}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
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
          <div style={{ background: "#f1f5f9", borderRadius: "1rem", padding: "1rem" }}>
            <Calendar
              onChange={setDate}
              value={date}
              calendarType="gregory"
              selectRange={false}
              tileClassName={({ date: d }) =>
                d.toDateString() === date.toDateString() ? 'calendar-black-text' : null
              }
              prevLabel={<span style={{ color: "#2563eb", fontWeight: 700 }}>{"<"}</span>}
              nextLabel={<span style={{ color: "#2563eb", fontWeight: 700 }}>{">"}</span>}
              next2Label={null}
              prev2Label={null}
              className="calendar-black-text"
            />
          </div>
          <div style={{ marginTop: "1.2rem", color: "#475569" }}>
            Selected: {date.toDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 