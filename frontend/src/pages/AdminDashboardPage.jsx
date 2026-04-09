import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/client';
import { PageSkeleton } from '../components/Skeleton';
import { useToast } from '../hooks/useToast';

export default function AdminDashboardPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadStats();
    loadUsers();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [search, tierFilter, page]);

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        addToast('Admin access required', 'error');
        navigate('/workouts', { replace: true });
        return;
      }
      addToast('Failed to load stats', 'error');
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      params.set('skip', String(page * PAGE_SIZE));
      params.set('limit', String(PAGE_SIZE));
      if (search) params.set('search', search);
      if (tierFilter) params.set('tier', tierFilter);

      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data);
    } catch {
      addToast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTier = async (userId, newTier) => {
    try {
      await api.put(`/admin/users/${userId}`, { subscription_tier: newTier });
      addToast('User tier updated', 'success');
      loadUsers();
      loadStats();
    } catch {
      addToast('Failed to update user', 'error');
    }
  };

  const handleToggleAdmin = async (userId, currentIsAdmin) => {
    try {
      await api.put(`/admin/users/${userId}`, { is_admin: !currentIsAdmin });
      addToast(`Admin ${currentIsAdmin ? 'revoked' : 'granted'}`, 'success');
      loadUsers();
    } catch {
      addToast('Failed to update admin status', 'error');
    }
  };

  const handleImpersonate = async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/impersonate`);
      // Store the current admin tokens so we can restore later
      localStorage.setItem('admin_access_token', localStorage.getItem('access_token'));
      localStorage.setItem('admin_refresh_token', localStorage.getItem('refresh_token'));
      // Store impersonation context
      localStorage.setItem('impersonating_user', JSON.stringify({
        userId,
        username: res.data.impersonating,
      }));
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      addToast(`Impersonating ${res.data.impersonating}`, 'info');
      navigate('/workouts', { replace: true });
    } catch {
      addToast('Failed to impersonate user', 'error');
    }
  };

  if (isLoading) {
    return <PageSkeleton variant="admin" />;
  }

  return (
    <section className="panel fade-in">
      <div className="panel-heading">
        <h2>Admin Dashboard</h2>
        <p>Platform metrics and user management.</p>
      </div>

      {/* ── Stats Cards ──────────────────────────── */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.total_users}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.pro_users}</span>
            <span className="admin-stat-label">Pro Users</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.free_users}</span>
            <span className="admin-stat-label">Free Users</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.total_workouts}</span>
            <span className="admin-stat-label">Total Workouts</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.total_exercises}</span>
            <span className="admin-stat-label">Total Exercises</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.users_last_7_days}</span>
            <span className="admin-stat-label">New Users (7d)</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.workouts_last_7_days}</span>
            <span className="admin-stat-label">Workouts (7d)</span>
          </div>
        </div>
      )}

      {/* ── User Management ──────────────────────── */}
      <div className="settings-section" style={{ marginTop: '1.5rem' }}>
        <h3>Users</h3>
        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
          <select value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setPage(0); }}>
            <option value="">All tiers</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </select>
        </div>

        <div className="admin-users-table-wrap">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Tier</th>
                <th>Verified</th>
                <th>Admin</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    <span className={`billing-tier-badge ${u.subscription_tier === 'pro' ? 'badge-pro' : 'badge-free'}`}>
                      {u.subscription_tier.toUpperCase()}
                    </span>
                  </td>
                  <td>{u.email_verified ? '✓' : '✗'}</td>
                  <td>{u.is_admin ? '✓' : '—'}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="admin-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      style={{ width: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => handleUpdateTier(u.id, u.subscription_tier === 'pro' ? 'free' : 'pro')}
                    >
                      {u.subscription_tier === 'pro' ? 'Downgrade' : 'Upgrade'}
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      style={{ width: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                    >
                      {u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      style={{ width: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => handleImpersonate(u.id)}
                    >
                      Impersonate
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="admin-pagination">
          <button type="button" className="ghost-btn" style={{ width: 'auto' }} disabled={page === 0} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {page + 1}</span>
          <button type="button" className="ghost-btn" style={{ width: 'auto' }} disabled={users.length < PAGE_SIZE} onClick={() => setPage(page + 1)}>
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
