import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import api from '../api/client';
import LogoMark from '../components/LogoMark';

function validate(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Must contain an uppercase letter';
  if (!/\d/.test(password)) return 'Must contain a digit';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Must contain a special character';
  return '';
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const validationError = validate(password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (validationError) return;

    if (!token) {
      setError('Missing reset token.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. The link may be expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <LogoMark />
        <h1>Set a New Password</h1>
        <p>Choose a strong password you haven't used before.</p>
      </div>

      <div className="auth-card">
        {done ? (
          <>
            <h2>Password updated ✓</h2>
            <p className="subtitle">Your password has been reset. You can now sign in.</p>
            <Link to="/login">
              <button type="button" style={{ marginTop: '1rem', width: '100%' }}>
                Sign in
              </button>
            </Link>
          </>
        ) : (
          <>
            <h2>Reset password</h2>
            <p className="subtitle">Enter your new password below.</p>
            <form onSubmit={handleSubmit} noValidate>
              <div>
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  className={touched && validationError ? 'invalid' : ''}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(true)}
                  disabled={isSubmitting}
                />
                {touched && validationError && <p className="field-error">{validationError}</p>}
              </div>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
            {error && <p className="error">{error}</p>}
            <p>
              <Link to="/login">Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
