import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import api from '../api/client';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';

export default function BodyMetricsPage() {
  const { addToast } = useToast();
  const [form, setForm] = useState({ weight: '', date: '', body_fat: '', muscle_mass: '', notes: '' });
  const [touched, setTouched] = useState({});
  const [metrics, setMetrics] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fieldErrors = {
    weight: touched.weight && (form.weight === '' || Number(form.weight) <= 0)
      ? 'Weight must be a positive number'
      : touched.weight && Number(form.weight) > 1000
        ? 'Weight cannot exceed 1000 kg'
        : '',
    date: touched.date && form.date && form.date > new Date().toISOString().slice(0, 10)
      ? 'Date cannot be in the future'
      : '',
  };

  const stats = useMemo(() => {
    if (metrics.length === 0) {
      return { latest: '-', first: '-', delta: '-' };
    }

    const first = Number(metrics[0].weight);
    const latest = Number(metrics[metrics.length - 1].weight);
    const delta = latest - first;

    return {
      latest: `${latest.toFixed(1)} kg`,
      first: `${first.toFixed(1)} kg`,
      delta: `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`,
    };
  }, [metrics]);

  const loadMetrics = async () => {
    const response = await api.get('/body-metrics');
    setMetrics(response.data);
  };

  useEffect(() => {
    loadMetrics().catch(() => addToast('Failed to load body metrics', 'error'));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ weight: true, date: true });
    if (fieldErrors.weight || fieldErrors.date) return;
    setIsSubmitting(true);
    try {
      await api.post('/body-metrics', {
        weight: Number(form.weight),
        date: form.date,
        body_fat_percentage: form.body_fat ? Number(form.body_fat) : null,
        muscle_mass: form.muscle_mass ? Number(form.muscle_mass) : null,
        notes: form.notes || null,
      });
      setForm({ weight: '', date: '', body_fat: '', muscle_mass: '', notes: '' });
      setTouched({});
      await loadMetrics();
      addToast('Body metric saved', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to save body metric', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteMetric = async (id) => {
    try {
      await api.delete(`/body-metrics/${id}`);
      setMetrics((prev) => prev.filter((m) => m.id !== id));
      addToast('Metric deleted', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete metric', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="panel fade-in">
      <div className="panel-heading">
        <h2>Body Metrics</h2>
        <p>Track weight trend over time and correlate it with strength progression.</p>
      </div>

      <div className="stats-grid">
        <article className="stat-card stagger-item">
          <h3>Latest</h3>
          <p>{stats.latest}</p>
        </article>
        <article className="stat-card stagger-item">
          <h3>Starting</h3>
          <p>{stats.first}</p>
        </article>
        <article className="stat-card stagger-item">
          <h3>Change</h3>
          <p>{stats.delta}</p>
        </article>
      </div>

      <form className="inline-form metric-form" onSubmit={handleSubmit} noValidate>
        <div>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="Weight (kg)"
            value={form.weight}
            className={fieldErrors.weight ? 'invalid' : ''}
            onChange={(event) => setForm({ ...form, weight: event.target.value })}
            onBlur={() => setTouched((prev) => ({ ...prev, weight: true }))}
            disabled={isSubmitting}
          />
          {fieldErrors.weight && <p className="field-error">{fieldErrors.weight}</p>}
        </div>
        <div>
          <input
            type="date"
            value={form.date}
            className={fieldErrors.date ? 'invalid' : ''}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            onBlur={() => setTouched((prev) => ({ ...prev, date: true }))}
            disabled={isSubmitting}
          />
          {fieldErrors.date && <p className="field-error">{fieldErrors.date}</p>}
        </div>
        <div>
          <input
            type="number" min="0" max="100" step="0.1" placeholder="Body Fat %"
            value={form.body_fat}
            onChange={(e) => setForm({ ...form, body_fat: e.target.value })}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <input
            type="number" min="0" max="500" step="0.1" placeholder="Muscle Mass (kg)"
            value={form.muscle_mass}
            onChange={(e) => setForm({ ...form, muscle_mass: e.target.value })}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <input
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={isSubmitting}
          />
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Add Metric'}
        </button>
      </form>

      {metrics.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button
            type="button"
            className="ghost-btn"
            style={{ width: 'auto' }}
            onClick={() => {
              const token = localStorage.getItem('access_token');
              fetch(`${api.defaults.baseURL}/export/body-metrics?format=csv`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.blob())
                .then(blob => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'body-metrics.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                })
                .catch(() => addToast('Export failed', 'error'));
            }}
          >
            ⬇ Export CSV
          </button>
        </div>
      )}

      {metrics.length === 0 ? (
        <EmptyState
          icon="⚖️"
          title="No metrics recorded"
          description="Add your first body weight entry above to start tracking your trend."
        />
      ) : (
        <>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={metrics.map((m) => ({
                date: m.date,
                weight: Number(m.weight),
                bodyFat: m.body_fat_percentage != null ? Number(m.body_fat_percentage) : null,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(191,210,232,0.6)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--ink-500)' }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: 'var(--ink-500)' }}
                  unit=" kg"
                  domain={['auto', 'auto']}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#f59e0b' }}
                  unit="%"
                  domain={[0, 'auto']}
                />
                <Tooltip
                  formatter={(v, name) => {
                    if (name === 'bodyFat') return [`${Number(v).toFixed(1)}%`, 'Body Fat'];
                    return [`${Number(v).toFixed(1)} kg`, 'Weight'];
                  }}
                  labelFormatter={(d) => new Date(d).toLocaleDateString()}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={{ fill: 'var(--accent)', r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bodyFat"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#f59e0b', r: 2 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="table-wrap">
            <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight</th>
                <th>Body Fat</th>
                <th>Muscle Mass</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.id}>
                  <td>{new Date(metric.date).toLocaleDateString()}</td>
                  <td>{Number(metric.weight).toFixed(1)} kg</td>
                  <td>{metric.body_fat_percentage != null ? `${metric.body_fat_percentage}%` : '–'}</td>
                  <td>{metric.muscle_mass != null ? `${metric.muscle_mass} kg` : '–'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{metric.notes || '–'}</td>
                  <td>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => setDeletingId(metric.id)}
                      aria-label="Delete metric"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete metric?"
          message="This will permanently remove this body weight entry."
          onConfirm={() => deleteMetric(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </section>
  );
}
