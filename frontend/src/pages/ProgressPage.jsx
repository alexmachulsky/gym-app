import { useEffect, useMemo, useState } from 'react';

import api from '../api/client';
import { getExerciseImageByName } from '../data/exerciseLibrary';

export default function ProgressPage() {
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const selectedExerciseName = useMemo(() => {
    return exercises.find((exercise) => exercise.id === exerciseId)?.name || 'Progress Snapshot';
  }, [exerciseId, exercises]);

  useEffect(() => {
    api
      .get('/exercises')
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
    <section className="panel fade-in">
      <div className="panel-heading">
        <h2>Progress Intelligence</h2>
        <p>Analyze your latest sessions to detect momentum, stagnation, and readiness to progress.</p>
      </div>

      <form className="inline-form" onSubmit={analyze}>
        <select value={exerciseId} onChange={(event) => setExerciseId(event.target.value)} required>
          <option value="">Choose exercise</option>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
        <button type="submit">Analyze Performance</button>
      </form>

      {error && <p className="error">{error}</p>}
      {result && (
        <article className={`result-card ${result.status}`}>
          <img src={getExerciseImageByName(selectedExerciseName)} alt={selectedExerciseName} />
          <div>
            <h3>{result.exercise}</h3>
            <p className="status-line">Status: <strong>{result.status}</strong></p>
            <p>{result.message}</p>
            <div className="metrics-row">
              <div>
                <span>Latest Volume</span>
                <strong>{result.latest_volume ?? 'N/A'}</strong>
              </div>
              <div>
                <span>Latest Estimated 1RM</span>
                <strong>{result.latest_estimated_1rm ?? 'N/A'}</strong>
              </div>
              <div>
                <span>Sessions Analyzed</span>
                <strong>{result.sessions_analyzed}</strong>
              </div>
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
