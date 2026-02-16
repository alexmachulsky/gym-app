import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../api/client';
import LogoMark from '../components/LogoMark';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', form);
      localStorage.setItem('access_token', response.data.access_token);
      navigate('/workouts', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <LogoMark />
        <h1>Train with Clarity. Improve with Data.</h1>
        <p>
          Every workout becomes a signal: volume, strength, trend, and plateau detection in one place.
        </p>
      </div>

      <div className="auth-card">
        <h2>Welcome back</h2>
        <p className="subtitle">Log in to continue your progression timeline.</p>
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
          <button type="submit">Sign in</button>
        </form>
        {error && <p className="error">{error}</p>}
        <p>
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
