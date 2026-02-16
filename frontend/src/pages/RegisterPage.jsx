import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../api/client';
import LogoMark from '../components/LogoMark';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await api.post('/auth/register', form);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
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
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          <button type="submit">Create account</button>
        </form>
        {error && <p className="error">{error}</p>}
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
