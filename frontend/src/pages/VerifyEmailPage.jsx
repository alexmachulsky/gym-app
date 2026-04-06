import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import api from '../api/client';
import LogoMark from '../components/LogoMark';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token provided.');
      return;
    }

    async function verify() {
      try {
        await api.post('/auth/verify-email', { token });
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.detail || 'Verification failed. The link may be expired.');
      }
    }

    verify();
  }, [token]);

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <LogoMark />
        <h1>Email Verification</h1>
        <p>Confirming your email address to activate full account access.</p>
      </div>

      <div className="auth-card">
        {status === 'verifying' && (
          <>
            <h2>Verifying…</h2>
            <p className="subtitle">Please wait while we confirm your email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h2>Email verified ✓</h2>
            <p className="subtitle">Your account is now fully active.</p>
            <Link to="/login">
              <button type="button" style={{ marginTop: '1rem', width: '100%' }}>
                Continue to login
              </button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h2>Verification failed</h2>
            <p className="error">{error}</p>
            <p>
              <Link to="/login">Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
