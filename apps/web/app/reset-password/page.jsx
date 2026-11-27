
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !data.session) {
        throw new Error(
          "Your recovery session is invalid or expired. Request a new recovery link."
        );
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) throw updateError;

      setMessage("Your password has been updated successfully.");

      setTimeout(() => {
        router.replace("/login");
      }, 2000);

    } catch (err) {
      setError(err.message || "Unable to update password.");
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

        <p className="eyebrow">ACCOUNT SECURITY</p>

        <h1>Reset Password</h1>

        <p className="auth-description">
          Create a new password for your account.
        </p>

        <form onSubmit={handleSubmit}>

          <label htmlFor="new-password">
            New Password
          </label>

          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter new password"
            autoComplete="new-password"
            minLength={6}
            required
          />

          <label htmlFor="confirm-password">
            Confirm Password
          </label>

          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            placeholder="Confirm new password"
            autoComplete="new-password"
            minLength={6}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
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

        <a href="/login" className="back-link">
          Return to login
        </a>

      </section>
    </main>
  );
}
