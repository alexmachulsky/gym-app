import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import api from '../api/client';
import EmptyState from '../components/EmptyState';
import { getExerciseImageByName } from '../data/exerciseLibrary';
import { useToast } from '../hooks/useToast';

export default function ProgressPage() {
  const { addToast } = useToast();
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState('');
  const [result, setResult] = useState(null);
  const [sessionData, setSessionData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedExerciseName = useMemo(() => {
    return exercises.find((exercise) => exercise.id === exerciseId)?.name || 'Progress Snapshot';
  }, [exerciseId, exercises]);

  useEffect(() => {
    api
      .get('/exercises')
      .then((response) => setExercises(response.data))
      .catch(() => addToast('Failed to load exercises', 'error'));
  }, []);

  const analyze = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);
    setSessionData([]);

    try {
      const [progressRes, workoutsRes] = await Promise.all([
        api.get(`/progress/${exerciseId}`),
        api.get(`/workouts`, { params: { exercise_id: exerciseId, limit: 10 } }),
      ]);
      setResult(progressRes.data);

      // Build per-session chart data from last 10 workouts containing this exercise
      const workoutsForExercise = workoutsRes.data
        .filter((w) => w.sets.some((s) => s.exercise_id === exerciseId))
        .slice(-10);

      const chartData = workoutsForExercise.map((workout) => {
        const relevantSets = workout.sets.filter((s) => s.exercise_id === exerciseId);
        const volume = relevantSets.reduce((sum, s) => sum + s.weight * s.reps * s.sets, 0);
        const est1rm = Math.max(...relevantSets.map((s) => s.weight * (1 + s.reps / 30)));
        return {
          date: new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          volume: Math.round(volume),
          est1rm: Math.round(est1rm * 10) / 10,
        };
      });

      setSessionData(chartData);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to analyze progress', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="panel fade-in">
      <div className="panel-heading">
        <h2>Progress Intelligence</h2>
        <p>Analyze your latest sessions to detect momentum, stagnation, and readiness to progress.</p>
      </div>

      {exercises.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No exercises available"
          description="Add exercises to your catalog first, then log workouts to analyze your progress."
        />
      ) : (
        <form className="inline-form" onSubmit={analyze}>
          <select value={exerciseId} onChange={(event) => setExerciseId(event.target.value)} required disabled={isLoading}>
            <option value="">Choose exercise</option>
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Analyzing…' : 'Analyze Performance'}
          </button>
        </form>
      )}

      {!exerciseId && exercises.length > 0 && !result && (
        <EmptyState
          icon="🎯"
          title="Select an exercise to analyze"
          description="Choose an exercise from the dropdown above to see your progression trend."
        />
      )}

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

      {sessionData.length > 0 && (
        <div className="chart-wrap">
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--ink-600)' }}>
            Last {sessionData.length} sessions — Volume & Estimated 1RM
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sessionData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(191,210,232,0.6)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ink-500)' }} />
              <YAxis yAxisId="vol" tick={{ fontSize: 11, fill: 'var(--ink-500)' }} />
              <YAxis yAxisId="orm" orientation="right" tick={{ fontSize: 11, fill: 'var(--ink-500)' }} unit=" kg" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
              <Bar yAxisId="vol" dataKey="volume" name="Volume" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="orm" dataKey="est1rm" name="Est. 1RM (kg)" fill="var(--brand)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
