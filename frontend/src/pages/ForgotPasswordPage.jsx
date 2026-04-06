import { useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../api/client';
import LogoMark from '../components/LogoMark';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;

    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <LogoMark />
        <h1>Reset Your Password</h1>
        <p>Enter the email address linked to your account and we'll send a reset link.</p>
      </div>

      <div className="auth-card">
        {sent ? (
          <>
            <h2>Check your inbox</h2>
            <p className="subtitle">
              If an account with that email exists, we've sent a reset link. It expires in 1 hour.
            </p>
            <p>
              <Link to="/login">Back to login</Link>
            </p>
          </>
        ) : (
          <>
            <h2>Forgot password</h2>
            <p className="subtitle">We'll email you a link to reset it.</p>
            <form onSubmit={handleSubmit} noValidate>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <button type="submit" disabled={isSubmitting || !email}>
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            {error && <p className="error">{error}</p>}
            <p>
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
