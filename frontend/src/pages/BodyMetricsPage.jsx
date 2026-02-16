import { useEffect, useMemo, useState } from 'react';

import api from '../api/client';

export default function BodyMetricsPage() {
  const [form, setForm] = useState({ weight: '', date: '' });
  const [metrics, setMetrics] = useState([]);
  const [error, setError] = useState('');

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
    loadMetrics().catch(() => setError('Failed to load body metrics'));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/body-metrics', {
        weight: Number(form.weight),
        date: form.date,
      });
      setForm({ weight: '', date: '' });
      await loadMetrics();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save body metric');
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

      <form className="inline-form metric-form" onSubmit={handleSubmit}>
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Weight (kg)"
          value={form.weight}
          onChange={(event) => setForm({ ...form, weight: event.target.value })}
          required
        />
        <input
          type="date"
          value={form.date}
          onChange={(event) => setForm({ ...form, date: event.target.value })}
          required
        />
        <button type="submit">Add Metric</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Weight</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.id}>
                <td>{new Date(metric.date).toLocaleDateString()}</td>
                <td>{Number(metric.weight).toFixed(1)} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
