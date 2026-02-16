import { useEffect, useState } from 'react';

import api from '../api/client';

export default function BodyMetricsPage() {
  const [form, setForm] = useState({ weight: '', date: '' });
  const [metrics, setMetrics] = useState([]);
  const [error, setError] = useState('');

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
    <section>
      <h2>Body Metrics</h2>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Weight"
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
        <button type="submit">Save</button>
      </form>
      {error && <p className="error">{error}</p>}

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
              <td>{metric.date}</td>
              <td>{metric.weight} kg</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
