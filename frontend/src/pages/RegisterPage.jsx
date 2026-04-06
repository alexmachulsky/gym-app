import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../api/client';
import LogoMark from '../components/LogoMark';

function validate(form) {
  const errors = {};
  if (!form.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!form.password) {
    errors.password = 'Password is required';
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = 'Password must contain at least one uppercase letter';
  } else if (!/\d/.test(form.password)) {
    errors.password = 'Password must contain at least one digit';
  } else if (!/[^A-Za-z0-9]/.test(form.password)) {
    errors.password = 'Password must contain at least one special character';
  }
  return errors;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', name: '' });
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
      await api.post('/auth/register', form);
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <LogoMark />
        <h1>Build your training operating system.</h1>
        <p>
          Create your account and start logging workouts, body metrics, and real progression signals.
        </p>
      </div>

      <div className="auth-card">
        <h2>Create account</h2>
        <p className="subtitle">Use an email and password to get started.</p>
        <form onSubmit={handleSubmit} noValidate>
          <div>
            <input
              type="text"
              placeholder="Name (optional)"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              disabled={isSubmitting}
            />
          </div>
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
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          We'll send a verification email after you sign up.
        </p>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
