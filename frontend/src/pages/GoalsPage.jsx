import { useEffect, useRef, useState } from 'react';

import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import Confetti from '../components/Confetti';
import EmptyState from '../components/EmptyState';
import { PageSkeleton } from '../components/Skeleton';
import UsageMeter from '../components/UsageMeter';
import { useToast } from '../hooks/useToast';

const GOAL_TYPE_LABELS = {
  workouts_per_week: 'Workouts / Week',
  workouts_per_month: 'Workouts / Month',
  volume_per_week: 'Volume / Week',
};

const PERIOD_LABELS = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function GoalsPage() {
  const { addToast } = useToast();
  const [goals, setGoals] = useState([]);
  const [progress, setProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevAchievedRef = useRef(new Set());
  const [form, setForm] = useState({
    goal_type: 'workouts_per_week',
    target_value: '3',
    period: 'weekly',
  });

  const loadData = async () => {
    try {
      const [gRes, pRes] = await Promise.all([
        api.get('/goals'),
        api.get('/goals/progress'),
      ]);
      setGoals(gRes.data);
      setProgress(pRes.data);
    } catch {
      addToast('Failed to load goals', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const progressMap = Object.fromEntries(progress.map((p) => [p.goal_id, p]));

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/goals', {
        goal_type: form.goal_type,
        target_value: Number(form.target_value),
        period: form.period,
      });
      setShowForm(false);
      await loadData();
      addToast('Goal created', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create goal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteGoal = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setProgress((prev) => prev.filter((p) => p.goal_id !== id));
      addToast('Goal deleted', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete goal', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) return <PageSkeleton variant="cards" />;

  return (
    <section className="panel fade-in">
      <div className="panel-heading">
        <h2>Goals & Streaks</h2>
        <p>Set training targets and track your consistency over time.</p>
      </div>

      <div className="button-row" style={{ marginBottom: '1rem' }}>
        <UsageMeter resource="goals" label="Goals" />
        <button type="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: '0.6rem', maxWidth: '480px', marginBottom: '1.2rem' }}>
          <select
            value={form.goal_type}
            onChange={(e) => setForm({ ...form, goal_type: e.target.value })}
            disabled={isSubmitting}
          >
            <option value="workouts_per_week">Workouts per Week</option>
            <option value="workouts_per_month">Workouts per Month</option>
            <option value="volume_per_week">Volume per Week</option>
          </select>
          <input
            type="number"
            min="1"
            max="10000"
            placeholder="Target value"
            value={form.target_value}
            onChange={(e) => setForm({ ...form, target_value: e.target.value })}
            required
            disabled={isSubmitting}
          />
          <select
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value })}
            disabled={isSubmitting}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Goal'}
          </button>
        </form>
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No goals yet"
          description="Set your first training goal to track consistency and build streaks."
        />
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => {
            const prog = progressMap[goal.id];
            const pct = prog ? prog.percentage : 0;
            const streak = prog ? prog.streak : 0;
            const current = prog ? prog.current_value : 0;

            return (
              <article key={goal.id} className={`goal-card stagger-item${pct >= 100 ? ' goal-achieved' : ''}`}>
                <div className="goal-card-header">
                  <div>
                    <h3>{GOAL_TYPE_LABELS[goal.goal_type] || goal.goal_type}</h3>
                    <span className="chip">{PERIOD_LABELS[goal.period] || goal.period}</span>
                  </div>
                  <button type="button" className="delete-btn" onClick={() => setDeletingId(goal.id)}>✕</button>
                </div>

                <div className="goal-ring-row">
                  <svg className="goal-ring" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke={pct >= 100 ? 'var(--lime)' : 'var(--accent)'}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - Math.min(pct, 100) / 100)}`}
                      transform="rotate(-90 40 40)"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                    <text x="40" y="44" textAnchor="middle" fill="var(--text)" fontSize="14" fontWeight="700">
                      {pct >= 100 ? '🎉' : `${pct.toFixed(0)}%`}
                    </text>
                  </svg>

                  <div style={{ flex: 1 }}>
                    <div className="goal-progress-bar-wrap">
                      <div className="goal-progress-bar">
                        <div className="goal-progress-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="goal-progress-label">{current} / {goal.target_value}</span>
                    </div>

                    {pct >= 100 && (
                      <p className="goal-celebrate-msg">🎉 Goal achieved! Keep up the momentum.</p>
                    )}
                  </div>
                </div>

                <div className="goal-stats">
                  <div>
                    <span>Progress</span>
                    <strong>{pct.toFixed(0)}%</strong>
                  </div>
                  <div>
                    <span>Streak</span>
                    <strong>{streak} {goal.period === 'weekly' ? 'weeks' : goal.period === 'monthly' ? 'months' : 'years'}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong style={{ color: goal.is_active ? 'var(--ok)' : 'var(--text-muted)' }}>
                      {goal.is_active ? 'Active' : 'Paused'}
                    </strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete goal?"
          message="This will permanently remove this goal and its progress history."
          onConfirm={() => deleteGoal(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </section>
  );
}
