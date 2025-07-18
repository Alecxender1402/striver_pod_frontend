import React, { useState, useEffect } from "react";
import Login from "./Login";
import SignUp from "./SignUp";
import Dashboard from "./Dashboard";

const features = [
  {
    icon: "🚀",
    title: "A2Z DSA Sheet",
    desc: "Comprehensive list of DSA problems for placement prep."
  },
  {
    icon: "📈",
    title: "Progress Tracker",
    desc: "Track your progress and stay motivated."
  },
  {
    icon: "🗓️",
    title: "Smart Calendar",
    desc: "Plan your DSA journey with a built-in calendar."
  },
  {
    icon: "🔒",
    title: "Secure Login",
    desc: "Your data is safe and private."
  }
];

const App = () => {
  const [page, setPage] = useState("home");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setPage("dashboard");
    }
  }, []);

  // Inject mobile-specific styles for inline elements
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width: 600px) {
        header {
          padding: 2rem 0.5rem 1rem 0.5rem !important;
        }
        h1 {
          font-size: 2rem !important;
        }
        h2 {
          font-size: 1.1rem !important;
        }
        #features-section {
          flex-direction: column !important;
          gap: 1.2rem !important;
        }
        .feature-card {
          min-width: 0 !important;
          max-width: 100% !important;
          padding: 1.2rem 0.7rem !important;
        }
        footer {
          font-size: 0.95rem !important;
          padding: 1rem 0.5rem 0.5rem 0.5rem !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(120deg, #2563eb 0%, #38bdf8 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflowX: "hidden",
      }}
    >
      {/* Hero Section */}
      <header
        style={{
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "4rem 1rem 2rem 1rem",
          textAlign: "center",
          color: "#fff",
          position: "relative",
        }}
      >
        {/* Top right buttons or Logout */}
        <div style={{
          position: "absolute",
          top: 24,
          right: 24,
          display: "flex",
          gap: "1rem"
        }}>
          {page === "dashboard" ? (
            <button
              style={{
                background: "#fff",
                color: "#2563eb",
                border: "none",
                borderRadius: "1.2rem",
                padding: "0.6rem 1.5rem",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37,99,235,0.10)",
                transition: "background 0.2s, color 0.2s"
              }}
              onClick={() => {
                localStorage.removeItem('token');
                setPage("home");
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = "#2563eb";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "#2563eb";
              }}
            >
              Logout
            </button>
          ) : (
            <>
              <button
                style={{
                  background: "#fff",
                  color: "#2563eb",
                  border: "none",
                  borderRadius: "1.2rem",
                  padding: "0.6rem 1.5rem",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.10)",
                  transition: "background 0.2s, color 0.2s"
                }}
                onClick={() => setPage("login")}
                onMouseOver={e => {
                  e.currentTarget.style.background = "#2563eb";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#2563eb";
                }}
              >
                Login
              </button>
              <button
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "1.2rem",
                  padding: "0.6rem 1.5rem",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.10)",
                  transition: "background 0.2s, color 0.2s"
                }}
                onClick={() => setPage("signup")}
                onMouseOver={e => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#2563eb";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = "#2563eb";
                  e.currentTarget.style.color = "#fff";
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
        {/* Only show hero if on home page */}
        {page === "home" && (
          <>
            <h1 style={{ fontSize: "3.2rem", fontWeight: 900, margin: 0, letterSpacing: "-1px" }}>
              Striver A2Z DSA Pod
            </h1>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 400, margin: "1rem 0 2.5rem 0", color: "#e0e7ff" }}>
              Your Ultimate Placement Preparation Companion
            </h2>
            <a
              href="#features"
              style={{
                background: "#fff",
                color: "#2563eb",
                padding: "1.1rem 2.5rem",
                borderRadius: "2rem",
                fontWeight: 700,
                fontSize: "1.2rem",
                textDecoration: "none",
                boxShadow: "0 2px 12px rgba(37,99,235,0.15)",
                transition: "background 0.2s, color 0.2s",
                display: "inline-block",
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = "#2563eb";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "#2563eb";
              }}
            >
              Start Your Journey
            </a>
          </>
        )}
      </header>

      {/* Main Content Switcher */}
      {page === "home" && (
        <section
          id="features-section"
          style={{
            width: "100%",
            maxWidth: 1100,
            margin: "3rem auto 2rem auto",
            padding: "0 1rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "2.5rem",
            justifyContent: "center",
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card"
              style={{
                background: "#fff",
                borderRadius: "1.2rem",
                boxShadow: "0 4px 24px rgba(37,99,235,0.10)",
                padding: "2.5rem 2rem",
                flex: "1 1 320px",
                minWidth: 300,
                maxWidth: 340,
                textAlign: "center",
                transition: "transform 0.2s",
              }}
              onMouseOver={e => (e.currentTarget.style.transform = "translateY(-8px) scale(1.03)")}
              onMouseOut={e => (e.currentTarget.style.transform = "none")}
            >
              <div style={{ fontSize: "2.7rem", marginBottom: "1.2rem" }}>{f.icon}</div>
              <h3 style={{ color: "#2563eb", fontWeight: 700, fontSize: "1.3rem", margin: "0 0 0.5rem 0" }}>
                {f.title}
              </h3>
              <p style={{ color: "#475569", fontSize: "1.05rem", margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </section>
      )}
      {page === "login" && (
        <Login onBack={() => setPage("home")} onSuccess={() => setPage("dashboard")} />
      )}
      {page === "signup" && <SignUp onBack={() => setPage("home")} />}
      {page === "dashboard" && <Dashboard />}

      {/* Footer */}
      <footer
        style={{
          marginTop: "auto",
          padding: "2rem 1rem 1rem 1rem",
          textAlign: "center",
          color: "#e0e7ff",
          fontSize: "1.1rem",
          width: "100%",
          background: "rgba(37,99,235,0.15)",
        }}
      >
        <span>
          &copy; {new Date().getFullYear()} Striver A2Z DSA Pod. All rights reserved. |{" "}
        </span>
        <a
          href="https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#fff", textDecoration: "underline" }}
        >
          Striver SDE Sheet
        </a>
      </footer>
    </div>
  );
};

export default App;