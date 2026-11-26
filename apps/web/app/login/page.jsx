
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );

      if (error) {
        throw error;
      }

      setMessage(
        "If an account exists for this email, a password recovery link will be sent."
      );
    } catch (error) {
      setMessage(
        error.message || "Unable to send the recovery request."
      );
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

        <p className="eyebrow">ACCOUNT RECOVERY</p>

        <h1>Forgot password?</h1>

        <p className="auth-description">
          Enter your registered email address to request a password reset.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="recovery-email">
            Email address
          </label>

          <input
            id="recovery-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send recovery link"}
          </button>
        </form>

        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}

        <a href="/login" className="back-link">
          Return to login
        </a>
      </section>
    </main>
  );
}
