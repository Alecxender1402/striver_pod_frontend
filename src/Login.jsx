import React, { useState } from "react";

const Login = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://striver-pod-backend-3.onrender.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: "1.2rem",
      boxShadow: "0 4px 24px rgba(37,99,235,0.10)",
      padding: "2.5rem 2rem",
      minWidth: 320,
      maxWidth: 360,
      margin: "3rem auto",
      textAlign: "center"
    }}>
      <h2 style={{ color: "#2563eb", marginBottom: "1.5rem" }}>Login</h2>
      {error && (
        <div style={{
          background: "#fef2f2",
          color: "#dc2626",
          padding: "0.75rem",
          borderRadius: "0.5rem",
          marginBottom: "1rem",
          fontSize: "0.9rem"
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.8rem",
            marginBottom: "1rem",
            borderRadius: "0.7rem",
            border: "1px solid #cbd5e1",
            fontSize: "1rem",
            boxSizing: "border-box"
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.8rem",
            marginBottom: "1.5rem",
            borderRadius: "0.7rem",
            border: "1px solid #cbd5e1",
            fontSize: "1rem",
            boxSizing: "border-box"
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#94a3b8" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "0.7rem",
            padding: "0.9rem",
            fontWeight: 700,
            fontSize: "1.1rem",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "1rem",
            transition: "background 0.2s"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <button
        onClick={onBack}
        disabled={loading}
        style={{
          background: "none",
          color: "#2563eb",
          border: "none",
          textDecoration: "underline",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "1rem"
        }}
      >
        Back to Home
      </button>
    </div>
  );
};

export default Login; 