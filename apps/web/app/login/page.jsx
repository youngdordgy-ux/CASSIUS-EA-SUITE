
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        window.location.href = "/";
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) throw error;

        setMessage(
          "Registration successful. Check your email for verification."
        );
      }
    } catch (error) {
      setMessage(error.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          CASSIUS
          <span>EA SUITE</span>
        </div>

        <p className="eyebrow">SECURE WORKSPACE ACCESS</p>

        <h1>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>

        <p className="auth-description">
          Access your trading research and paper trading environment.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email address</label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            minLength={8}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        {message && (
          <p className="auth-message">{message}</p>
        )}

        <button
          className="auth-switch"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already registered? Sign in"}
        </button>

        <a href="/" className="back-link">
          Return to dashboard
        </a>
      </section>
    </main>
  );
}
