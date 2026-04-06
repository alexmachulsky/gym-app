import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import api from '../api/client';
import EmptyState from '../components/EmptyState';
import FeatureGate from '../components/FeatureGate';
import ProBadge from '../components/ProBadge';
import { getExerciseImageByName } from '../data/exerciseLibrary';
import { useToast } from '../hooks/useToast';

const TABS = ['Analysis', 'Personal Records', 'Muscle Groups', 'Recovery'];
const PIE_COLORS = ['#a5fa01', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function ProgressPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('Analysis');
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState('');
  const [result, setResult] = useState(null);
  const [sessionData, setSessionData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [muscleVolume, setMuscleVolume] = useState([]);
  const [recovery, setRecovery] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [dateRange, setDateRange] = useState('10');  // '10','30','90','180','365','all'

  const selectedExerciseName = useMemo(() => {
    return exercises.find((exercise) => exercise.id === exerciseId)?.name || 'Progress Snapshot';
  }, [exerciseId, exercises]);

  useEffect(() => {
    api
      .get('/exercises')
      .then((response) => setExercises(response.data))
      .catch(() => addToast('Failed to load exercises', 'error'));
  }, []);

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === 'Personal Records') {
      api.get('/progress/records/recent/all', { params: { days: 30 } })
        .then((res) => setRecords(res.data))
        .catch(() => addToast('Failed to load records', 'error'));
    } else if (activeTab === 'Muscle Groups') {
      api.get('/progress/muscle-groups/volume')
        .then((res) => setMuscleVolume(res.data))
        .catch(() => addToast('Failed to load muscle groups', 'error'));
    } else if (activeTab === 'Recovery') {
      api.get('/progress/recovery/status')
        .then((res) => setRecovery(res.data))
        .catch(() => addToast('Failed to load recovery', 'error'));
    }
  }, [activeTab]);

  const analyze = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);
    setSessionData([]);
    setComparison(null);

    try {
      const params = {};
      if (dateRange !== 'all') {
        params.limit = Number(dateRange);
      } else {
        params.limit = 100;
      }
      const [progressRes, compareRes] = await Promise.all([
        api.get(`/progress/${exerciseId}`, { params }),
        api.get(`/progress/compare/${exerciseId}`).catch(() => ({ data: null })),
      ]);
      setResult(progressRes.data);
      setComparison(compareRes.data);

      if (progressRes.data.session_data && progressRes.data.session_data.length > 0) {
        setSessionData(progressRes.data.session_data.map((s) => ({
          date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          volume: Math.round(s.volume),
          est1rm: Math.round(s.estimated_1rm * 10) / 10,
        })));
      }
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
        <p>Analyze progression, track personal records, and monitor muscle group balance.</p>
      </div>

      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab-btn${activeTab === tab ? ' tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {(tab === 'Muscle Groups' || tab === 'Recovery') && <ProBadge />}
          </button>
        ))}
      </div>

      {activeTab === 'Analysis' && (
        <>
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
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} disabled={isLoading}>
                <option value="10">Last 10 sessions</option>
                <option value="30">Last 30 sessions</option>
                <option value="90">Last 90 sessions</option>
                <option value="all">All Time</option>
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
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
                Last {sessionData.length} sessions — Volume & Estimated 1RM
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sessionData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis yAxisId="vol" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis yAxisId="orm" orientation="right" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} unit=" kg" />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
                  <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
                  <Bar yAxisId="vol" dataKey="volume" name="Volume" fill="var(--lime)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="orm" dataKey="est1rm" name="Est. 1RM (kg)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {comparison && comparison.current && comparison.previous && (
            <div className="comparison-card">
              <h3 style={{ margin: '0 0 0.6rem', fontSize: '1rem', color: 'var(--text)' }}>vs. Previous Session</h3>
              <div className="comparison-grid">
                <div className="comparison-col">
                  <span className="comparison-label">Current ({new Date(comparison.current.date).toLocaleDateString()})</span>
                  <div className="comparison-stat"><span>Volume</span><strong>{Math.round(comparison.current.volume).toLocaleString()}</strong></div>
                  <div className="comparison-stat"><span>Max Weight</span><strong>{comparison.current.max_weight} kg</strong></div>
                  <div className="comparison-stat"><span>Total Reps</span><strong>{comparison.current.total_reps}</strong></div>
                </div>
                <div className="comparison-deltas">
                  {[
                    { key: 'volume_change', label: 'Volume' },
                    { key: 'weight_change', label: 'Weight' },
                    { key: 'reps_change', label: 'Reps' },
                  ].map(({ key, label }) => {
                    const val = comparison.deltas?.[key];
                    const isUp = val > 0;
                    const isDown = val < 0;
                    return (
                      <div key={key} className="delta-badge" style={{ color: isUp ? 'var(--ok)' : isDown ? 'var(--warn)' : 'var(--text-muted)' }}>
                        {isUp ? '↑' : isDown ? '↓' : '–'} {label}: {val != null ? (isUp ? '+' : '') + val : '–'}
                      </div>
                    );
                  })}
                </div>
                <div className="comparison-col">
                  <span className="comparison-label">Previous ({new Date(comparison.previous.date).toLocaleDateString()})</span>
                  <div className="comparison-stat"><span>Volume</span><strong>{Math.round(comparison.previous.volume).toLocaleString()}</strong></div>
                  <div className="comparison-stat"><span>Max Weight</span><strong>{comparison.previous.max_weight} kg</strong></div>
                  <div className="comparison-stat"><span>Total Reps</span><strong>{comparison.previous.total_reps}</strong></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'Personal Records' && (
        <>
          {records.length === 0 ? (
            <EmptyState icon="🏆" title="No recent records" description="Keep training — new PRs from the last 30 days will appear here." />
          ) : (
            <div className="pr-grid">
              {records.map((r, i) => (
                <article key={i} className="pr-card stagger-item">
                  <div className="pr-card-type">{r.record_type === 'max_weight' ? '🏋️ Max Weight' : r.record_type === 'max_estimated_1rm' ? '💪 Est. 1RM' : '📦 Max Volume'}</div>
                  <h3>{r.exercise_name}</h3>
                  <p className="pr-value">{r.value} {r.record_type === 'max_volume' ? 'vol' : 'kg'}</p>
                  <span className="pr-date">{new Date(r.date_achieved).toLocaleDateString()}</span>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'Muscle Groups' && (
        <FeatureGate feature="Muscle Group Analytics">
        <>
          {muscleVolume.length === 0 ? (
            <EmptyState icon="💪" title="No muscle group data" description="Log workouts with categorized exercises to see volume distribution." />
          ) : (
            <>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={muscleVolume}
                      dataKey="total_volume"
                      nameKey="muscle_group"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={({ muscle_group, percentage }) => `${muscle_group} ${percentage}%`}
                    >
                      {muscleVolume.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Muscle Group</th><th>Volume</th><th>%</th><th>Workouts</th></tr>
                  </thead>
                  <tbody>
                    {muscleVolume.map((mg) => (
                      <tr key={mg.muscle_group}>
                        <td><strong>{mg.muscle_group}</strong></td>
                        <td>{Math.round(mg.total_volume).toLocaleString()}</td>
                        <td>{mg.percentage}%</td>
                        <td>{mg.workout_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
        </FeatureGate>
      )}

      {activeTab === 'Recovery' && (
        <FeatureGate feature="Recovery Tracking">
        <>
          {recovery.length === 0 ? (
            <EmptyState icon="🔄" title="No recovery data" description="Log workouts with categorized exercises to track muscle recovery." />
          ) : (
            <div className="recovery-grid">
              {recovery.map((r) => (
                <article key={r.muscle_group} className={`recovery-card recovery-${r.status} stagger-item`}>
                  <h3>{r.muscle_group}</h3>
                  <p className="recovery-days">{r.days_since != null ? `${r.days_since} days ago` : 'Not trained yet'}</p>
                  <span className={`chip ${r.status === 'recovered' ? '' : 'muted'}`}>{r.status}</span>
                  {r.last_trained && <span className="recovery-date">Last: {new Date(r.last_trained).toLocaleDateString()}</span>}
                </article>
              ))}
            </div>
          )}
        </>
        </FeatureGate>
      )}
    </section>
  );
}
