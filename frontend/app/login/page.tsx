'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth-client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Registration successful! Please login.');
    } else if (searchParams.get('reset') === 'success') {
      setSuccessMessage('Password reset successful! Please login with your new password.');
    } else if (searchParams.get('error') === 'session_expired') {
      setError('Your session has expired. Please login again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        setError(result.error.message || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push('/todos');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">T</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to manage your tasks</p>
        </div>

        {successMessage && (
          <div className="auth-alert auth-alert-success">{successMessage}</div>
        )}

        {error && (
          <div className="auth-alert auth-alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
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

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '16px' }}>
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>

        <p className="auth-footer" style={{ marginTop: '12px' }}>
          Don&apos;t have an account? <Link href="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
