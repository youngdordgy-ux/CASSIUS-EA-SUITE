
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const params = new URLSearchParams(window.location.search);
        const requestedPath = params.get("next");

        const destination =
          requestedPath &&
          requestedPath.startsWith("/") &&
          !requestedPath.startsWith("//")
            ? requestedPath
            : "/";

        router.replace(destination);
        router.refresh();

      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              `${window.location.origin}/auth/callback?next=/`,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/");
          router.refresh();
        } else {
          setMessage(
            "Registration received. Please check your email to confirm your account."
          );
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
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

        <p className="eyebrow">
          CASSIUS TECHNOLOGIES
        </p>

        <h1>
          {mode === "login"
            ? "Welcome Back"
            : "Create Your Account"}
        </h1>

        <p className="auth-description">
          {mode === "login"
            ? "Sign in to access your trading research workspace."
            : "Register to access the CASSIUS EA SUITE platform."}
        </p>

        <form onSubmit={handleSubmit}>

          <label htmlFor="email">
            Email Address
          </label>

          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">
            Password
          </label>

          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
              minLength={6}
              required
              style={{ width: "100%" }}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                color: "#64a5ff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: "10px" }}>
              <a href="/forgot-password" className="back-link">
                Forgot password?
              </a>
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>

        </form>

        {error && (
          <p className="auth-message" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}

        <div style={{ marginTop: "25px", textAlign: "center" }}>
          <p>
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
          </p>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
              setError("");
            }}
            style={{
              background: "transparent",
              color: "#64a5ff",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {mode === "login"
              ? "Create an account"
              : "Sign in instead"}
          </button>
        </div>

        <p className="footer" style={{ marginTop: "30px" }}>
          © {new Date().getFullYear()} CASSIUS EA SUITE
        </p>

      </section>
    </main>
  );
}
