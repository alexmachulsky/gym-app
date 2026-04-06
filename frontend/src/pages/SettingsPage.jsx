import { useEffect, useState } from 'react';

import api from '../api/client';
import { useToast } from '../hooks/useToast';
import { useSubscription } from '../hooks/useSubscription';

function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export default function SettingsPage() {
  const { addToast } = useToast();
  const { subscription, isPro, refresh: refreshSub } = useSubscription();
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState(getTheme);
  const [passwordForm, setPasswordForm] = useState({ current: '', new_password: '', confirm: '' });
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [equipProfiles, setEquipProfiles] = useState([]);
  const [equipForm, setEquipForm] = useState({ name: '', equipment_list: '' });
  const [showEquipForm, setShowEquipForm] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState('monthly');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    Promise.all([
      api.get('/settings'),
      api.get('/equipment-profiles/'),
    ])
      .then(([settingsRes, equipRes]) => {
        setSettings(settingsRes.data);
        setEquipProfiles(equipRes.data);
      })
      .catch(() => addToast('Failed to load settings', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.put('/settings', {
        weight_unit: settings.weight_unit,
        distance_unit: settings.distance_unit,
        rest_timer_default: Number(settings.rest_timer_default),
      });
      setSettings(res.data);
      addToast('Settings saved', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to save settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  const handleUpgrade = async () => {
    setBillingLoading(true);
    try {
      const res = await api.post('/billing/checkout', { interval: billingInterval });
      window.location.href = res.data.checkout_url;
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to start checkout', 'error');
      setBillingLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await api.post('/billing/portal');
      window.location.href = res.data.portal_url;
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to open billing portal', 'error');
      setBillingLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm) {
      addToast('Passwords do not match', 'error');
      return;
    }
    setIsChangingPw(true);
    try {
      await api.put('/auth/change-password', {
        current_password: passwordForm.current,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current: '', new_password: '', confirm: '' });
      addToast('Password updated', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to change password', 'error');
    } finally {
      setIsChangingPw(false);
    }
  };

  const downloadExport = async (endpoint, filename) => {
    try {
      const res = await api.get(endpoint);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      addToast(`Downloaded ${filename}`, 'success');
    } catch {
      addToast('Export failed', 'error');
    }
  };

  const createEquipProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/equipment-profiles/', equipForm);
      setEquipProfiles((prev) => [res.data, ...prev]);
      setEquipForm({ name: '', equipment_list: '' });
      setShowEquipForm(false);
      addToast('Equipment profile created', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create profile', 'error');
    }
  };

  const deleteEquipProfile = async (id) => {
    try {
      await api.delete(`/equipment-profiles/${id}`);
      setEquipProfiles((prev) => prev.filter((p) => p.id !== id));
      addToast('Profile deleted', 'success');
    } catch {
      addToast('Failed to delete profile', 'error');
    }
  };

  if (isLoading) return <section className="panel fade-in"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></section>;
  if (!settings) return null;

  const labelStyle = { display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.8rem' };

  return (
    <section className="panel fade-in">
      <div className="panel-heading">
        <h2>Settings</h2>
        <p>Customize your measurement preferences, appearance, and account.</p>
      </div>

      {/* ── Appearance ─────────────────────────────── */}
      <div className="settings-section">
        <h3>Appearance</h3>
        <div className="theme-toggle-row">
          <span>{theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
          <button type="button" className="ghost-btn" onClick={toggleTheme} style={{ width: 'auto' }}>
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* ── Subscription ───────────────────────────── */}
      <div className="settings-section">
        <h3>Subscription</h3>
        <div className="billing-plan-card">
          <div className="billing-plan-header">
            <span className={`billing-tier-badge ${isPro ? 'badge-pro' : 'badge-free'}`}>
              {isPro ? 'PRO' : 'FREE'}
            </span>
            <span className="billing-plan-label">
              {isPro
                ? `Pro Plan — ${subscription?.plan === 'pro_yearly' ? 'Yearly' : 'Monthly'}`
                : 'Free Plan'}
            </span>
          </div>
          {isPro && subscription?.current_period_end && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
              {subscription.cancel_at_period_end
                ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
            </p>
          )}
          <div style={{ marginTop: '1rem' }}>
            {isPro ? (
              <button
                type="button"
                className="ghost-btn"
                style={{ width: 'auto' }}
                disabled={billingLoading}
                onClick={handleManageBilling}
              >
                {billingLoading ? 'Opening…' : 'Manage Subscription'}
              </button>
            ) : (
              <div className="billing-upgrade-row">
                <div className="billing-interval-toggle">
                  <button
                    type="button"
                    className={`billing-interval-btn ${billingInterval === 'monthly' ? 'active' : ''}`}
                    onClick={() => setBillingInterval('monthly')}
                  >
                    $4.99/mo
                  </button>
                  <button
                    type="button"
                    className={`billing-interval-btn ${billingInterval === 'yearly' ? 'active' : ''}`}
                    onClick={() => setBillingInterval('yearly')}
                  >
                    $29.99/yr <span className="billing-save-badge">Save 50%</span>
                  </button>
                </div>
                <button
                  type="button"
                  disabled={billingLoading}
                  onClick={handleUpgrade}
                >
                  {billingLoading ? 'Redirecting…' : 'Upgrade to Pro'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Units & Defaults ────────────────────────── */}
      <div className="settings-section">
        <h3>Units & Defaults</h3>
        <form onSubmit={handleSave} style={{ maxWidth: '480px' }}>
          <label style={labelStyle}>
            Weight Unit
            <select
              value={settings.weight_unit}
              onChange={(e) => setSettings({ ...settings, weight_unit: e.target.value })}
              disabled={isSubmitting}
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="lbs">Pounds (lbs)</option>
            </select>
          </label>

          <label style={labelStyle}>
            Distance Unit
            <select
              value={settings.distance_unit}
              onChange={(e) => setSettings({ ...settings, distance_unit: e.target.value })}
              disabled={isSubmitting}
            >
              <option value="km">Kilometers (km)</option>
              <option value="mi">Miles (mi)</option>
            </select>
          </label>

          <label style={labelStyle}>
            Default Rest Timer (seconds)
            <input
              type="number"
              min="10"
              max="600"
              value={settings.rest_timer_default}
              onChange={(e) => setSettings({ ...settings, rest_timer_default: e.target.value })}
              disabled={isSubmitting}
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* ── Data Export ─────────────────────────────── */}
      <div className="settings-section">
        <h3>Data Export</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Download your data as CSV files.
        </p>
        <div className="button-row">
          <button type="button" className="ghost-btn" onClick={() => downloadExport('/export/workouts', 'workouts.csv')}>
            📥 Export Workouts
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadExport('/export/body-metrics', 'body-metrics.csv')}>
            📥 Export Body Metrics
          </button>
        </div>
      </div>

      {/* ── Account ────────────────────────────────── */}
      <div className="settings-section">
        <h3>Account</h3>
        <form onSubmit={handleChangePassword} style={{ maxWidth: '480px' }}>
          <label style={labelStyle}>
            Current Password
            <input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              required
              disabled={isChangingPw}
            />
          </label>
          <label style={labelStyle}>
            New Password
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              required
              minLength={8}
              disabled={isChangingPw}
            />
          </label>
          <label style={labelStyle}>
            Confirm New Password
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              required
              disabled={isChangingPw}
            />
          </label>
          <button type="submit" disabled={isChangingPw}>
            {isChangingPw ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* ── Equipment Profiles ────────────────────── */}
      <div className="settings-section">
        <h3>Equipment Profiles</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Save which equipment you have available at different locations (home gym, commercial gym, etc.)
        </p>
        <button type="button" className="ghost-btn" style={{ width: 'auto', marginBottom: '0.75rem' }} onClick={() => setShowEquipForm(!showEquipForm)}>
          {showEquipForm ? 'Cancel' : '+ Add Profile'}
        </button>
        {showEquipForm && (
          <form onSubmit={createEquipProfile} style={{ maxWidth: '480px', marginBottom: '1rem' }}>
            <label style={labelStyle}>
              Profile Name
              <input
                placeholder="e.g. Home Gym"
                value={equipForm.name}
                onChange={(e) => setEquipForm({ ...equipForm, name: e.target.value })}
                required
              />
            </label>
            <label style={labelStyle}>
              Equipment (comma-separated)
              <input
                placeholder="barbell, dumbbell, pull-up bar, bands"
                value={equipForm.equipment_list}
                onChange={(e) => setEquipForm({ ...equipForm, equipment_list: e.target.value })}
                required
              />
            </label>
            <button type="submit">Save Profile</button>
          </form>
        )}
        {equipProfiles.length > 0 && (
          <div className="equip-profile-list">
            {equipProfiles.map((p) => (
              <div key={p.id} className="equip-profile-card">
                <div>
                  <strong>{p.name}</strong>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {p.equipment_list}
                  </span>
                </div>
                <button type="button" className="delete-btn" onClick={() => deleteEquipProfile(p.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
