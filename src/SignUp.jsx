import React, { useState } from "react";

const SignUp = ({ onBack }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://striver-pod-backend-3.onrender.com';

  const validateForm = () => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters long");
      return false;
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim(), 
          password 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Account created successfully! You can now log in.");
        setName("");
        setEmail("");
        setPassword("");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      console.error('Signup error:', err);
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
      <h2 style={{ color: "#2563eb", marginBottom: "1.5rem" }}>Sign Up</h2>
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
      {success && (
        <div style={{
          background: "#f0fdf4",
          color: "#16a34a",
          padding: "0.75rem",
          borderRadius: "0.5rem",
          marginBottom: "1rem",
          fontSize: "0.9rem"
        }}>
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          placeholder="Password (min 6 characters)"
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
          {loading ? "Signing up..." : "Sign Up"}
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

export default SignUp; 