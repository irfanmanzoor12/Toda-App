'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">T</div>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">We&apos;ve sent a reset link</p>
          </div>

          <div className="auth-alert auth-alert-success">
            <p>We&apos;ve sent a password reset link to <strong>{email}</strong></p>
            <p style={{ marginTop: '8px', fontSize: '13px', opacity: 0.8 }}>
              Please check your email and click the link to reset your password.
              The link will expire in 1 hour.
            </p>
          </div>

          <p className="auth-footer">
            <Link href="/login">Back to Sign In</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">T</div>
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-subtitle">Enter your email and we&apos;ll send you a reset link</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '24px' }}>
          Remember your password? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
