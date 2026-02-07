'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth-client';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || name.trim().length < 2) {
      setError('Please enter your name (at least 2 characters)');
      return;
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        setError(result.error.message || 'Registration failed');
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push('/todos');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">T</div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Start organizing your tasks today</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="John Doe"
              className="form-input"
            />
          </div>

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
              minLength={8}
              placeholder="Create a password"
              className="form-input"
            />
            <p className="form-hint">Minimum 8 characters</p>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '24px' }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
