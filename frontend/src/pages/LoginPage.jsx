import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import api from '../api/client';
import LogoMark from '../components/LogoMark';

function validate(form) {
  const errors = {};
  if (!form.email) errors.email = 'Email is required';
  if (!form.password) errors.password = 'Password is required';
  return errors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = validate(form);

  const handleBlur = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    if (Object.keys(errors).length > 0) return;

    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', form);
      // TODO: Remove localStorage storage once backend cookie migration is complete
      // Currently stored for backward compatibility and admin impersonation flow
      localStorage.setItem('access_token', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      navigate('/workouts', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <LogoMark />
        <div>
          <h1>
            Train with <em>clarity.</em><br />
            Improve with data.
          </h1>
          <p>
            Every workout becomes a signal — volume, strength, trend, and plateau detection.
            One ledger. One iron-clad source of truth.
          </p>
        </div>
        <div className="auth-brand-footer">
          <span>EST · 2026</span>
          <span>Volume · 04</span>
          <span>Edition · Iron</span>
        </div>
      </div>

      <div className="auth-card">
        <h2>Welcome back</h2>
        <p className="subtitle">Log in to continue your progression timeline.</p>
        {location.state?.registered && (
          <p style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Account created! Check your email to verify, then log in.
          </p>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              className={touched.email && errors.email ? 'invalid' : ''}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              onBlur={() => handleBlur('email')}
              disabled={isSubmitting}
            />
            {touched.email && errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              className={touched.password && errors.password ? 'invalid' : ''}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              onBlur={() => handleBlur('password')}
              disabled={isSubmitting}
            />
            {touched.password && errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <p>
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <p>
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
