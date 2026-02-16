import { useEffect, useState } from 'react';

import api from '../api/client';

export default function ProgressPage() {
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/exercises')
      .then((response) => setExercises(response.data))
      .catch(() => setError('Failed to load exercises'));
  }, []);

  const analyze = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);

    try {
      const response = await api.get(`/progress/${exerciseId}`);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze progress');
    }
  };

  return (
    <section>
      <h2>Progress Analysis</h2>
      <form className="inline-form" onSubmit={analyze}>
        <select value={exerciseId} onChange={(event) => setExerciseId(event.target.value)} required>
          <option value="">Choose exercise</option>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
        <button type="submit">Analyze</button>
      </form>

      {error && <p className="error">{error}</p>}
      {result && (
        <article className="result-card">
          <h3>{result.exercise}</h3>
          <p>Status: <strong>{result.status}</strong></p>
          <p>{result.message}</p>
          <p>Latest volume: {result.latest_volume ?? 'N/A'}</p>
          <p>Latest estimated 1RM: {result.latest_estimated_1rm ?? 'N/A'}</p>
          <p>Sessions analyzed: {result.sessions_analyzed}</p>
        </article>
      )}
    </section>
  );
}
