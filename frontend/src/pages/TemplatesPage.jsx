import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import UsageMeter from '../components/UsageMeter';
import { useToast } from '../hooks/useToast';

export default function TemplatesPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', is_draft: false, template_sets: [] });

  const exerciseMap = Object.fromEntries(exercises.map((e) => [e.id, e]));

  const loadData = async () => {
    try {
      const [tRes, eRes] = await Promise.all([api.get('/templates'), api.get('/exercises')]);
      setTemplates(tRes.data);
      setExercises(eRes.data);
    } catch {
      addToast('Failed to load templates', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const addSetRow = () => {
    setForm((prev) => ({
      ...prev,
      template_sets: [
        ...prev.template_sets,
        { exercise_id: '', weight: '', reps: '10', sets: '3', order: prev.template_sets.length, segment: 'main' },
      ],
    }));
  };

  const updateSetRow = (idx, key, value) => {
    setForm((prev) => {
      const copy = [...prev.template_sets];
      copy[idx] = { ...copy[idx], [key]: value };
      return { ...prev, template_sets: copy };
    });
  };

  const removeSetRow = (idx) => {
    setForm((prev) => ({
      ...prev,
      template_sets: prev.template_sets.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        is_draft: form.is_draft,
        template_sets: form.template_sets
          .filter((s) => s.exercise_id)
          .map((s, i) => ({
            exercise_id: s.exercise_id,
            weight: s.weight ? Number(s.weight) : null,
            reps: s.reps ? Number(s.reps) : null,
            sets: s.sets ? Number(s.sets) : null,
            order: i,
            segment: s.segment,
          })),
      };
      await api.post('/templates', payload);
      setForm({ name: '', description: '', is_draft: false, template_sets: [] });
      setShowForm(false);
      await loadData();
      addToast('Template created', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create template', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const useTemplate = (tmpl) => {
    const prefill = tmpl.template_sets.map((ts) => ({
      exercise_id: ts.exercise_id,
      weight: ts.weight ? String(ts.weight) : '',
      reps: ts.reps ? String(ts.reps) : '10',
      sets: ts.sets ? String(ts.sets) : '3',
    }));
    sessionStorage.setItem('template_prefill', JSON.stringify(prefill));
    navigate('/workouts');
    addToast(`Template "${tmpl.name}" loaded — adjust and log.`, 'info');
  };

  const visibleTemplates = templates.filter((t) => showDrafts ? t.is_draft : !t.is_draft);

  const deleteTemplate = async (id) => {
    try {
      await api.delete(`/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      addToast('Template deleted', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete template', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) return <section className="panel fade-in"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></section>;

  return (
    <section className="panel fade-in">
      <div className="panel-heading">
        <h2>Workout Templates</h2>
        <p>Save your favourite routines and start workouts in one click.</p>
      </div>

      <div className="button-row" style={{ marginBottom: '1rem' }}>
        <UsageMeter resource="templates" label="Templates" />
        <button type="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Template'}
        </button>
        <button type="button" className={`ghost-btn${showDrafts ? '' : ''}`} onClick={() => setShowDrafts(!showDrafts)} style={{ width: 'auto' }}>
          {showDrafts ? 'Show Published' : 'Show Drafts'}
        </button>
      </div>

      {showForm && (
        <form className="template-form" onSubmit={handleCreate} style={{ marginBottom: '1.2rem' }}>
          <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <input
              placeholder="Template name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={isSubmitting}
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="set-grid">
            {form.template_sets.map((row, idx) => (
              <div key={idx} className="template-set-row">
                <select
                  value={row.exercise_id}
                  onChange={(e) => updateSetRow(idx, 'exercise_id', e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Select exercise</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
                <input
                  type="number" step="0.5" min="0" placeholder="Weight"
                  value={row.weight}
                  onChange={(e) => updateSetRow(idx, 'weight', e.target.value)}
                  disabled={isSubmitting}
                />
                <input
                  type="number" min="1" placeholder="Reps"
                  value={row.reps}
                  onChange={(e) => updateSetRow(idx, 'reps', e.target.value)}
                  disabled={isSubmitting}
                />
                <input
                  type="number" min="1" placeholder="Sets"
                  value={row.sets}
                  onChange={(e) => updateSetRow(idx, 'sets', e.target.value)}
                  disabled={isSubmitting}
                />
                <select
                  value={row.segment}
                  onChange={(e) => updateSetRow(idx, 'segment', e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="warmup">Warmup</option>
                  <option value="main">Main</option>
                  <option value="cooldown">Cooldown</option>
                </select>
                <button type="button" className="ghost-btn" onClick={() => removeSetRow(idx)} disabled={isSubmitting}>
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '0.6rem' }}>
            <label className="toggle-control">
              <input
                type="checkbox"
                checked={form.is_draft}
                onChange={(e) => setForm({ ...form, is_draft: e.target.checked })}
                disabled={isSubmitting}
              />
              Save as Draft
            </label>
          </div>

          <div className="button-row" style={{ marginTop: '0.6rem' }}>
            <button type="button" className="ghost-btn" onClick={addSetRow} disabled={isSubmitting}>Add Exercise</button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : form.is_draft ? 'Save Draft' : 'Save Template'}
            </button>
          </div>
        </form>
      )}

      {visibleTemplates.length === 0 ? (
        <EmptyState
          icon="📋"
          title={showDrafts ? 'No draft templates' : 'No templates yet'}
          description={showDrafts ? 'Save a template as draft to keep unfinished routines.' : 'Create a template to save your favourite workout routines for quick use.'}
        />
      ) : (
        <div className="template-grid">
          {visibleTemplates.map((tmpl) => (
            <article key={tmpl.id} className="template-card stagger-item">
              <div className="template-card-header">
                <div>
                  <h3>{tmpl.name}</h3>
                  {tmpl.description && <p>{tmpl.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {tmpl.is_draft && <span className="chip muted">Draft</span>}
                  <span className="chip">{tmpl.template_sets.length} exercises</span>
                </div>
              </div>
              <ul className="template-set-list">
                {tmpl.template_sets.map((ts) => {
                  const ex = exerciseMap[ts.exercise_id];
                  return (
                    <li key={ts.id}>
                      <strong>{ex ? ex.name : 'Unknown'}</strong>
                      <span>
                        {ts.weight ? `${ts.weight} kg` : '–'} × {ts.reps || '–'} reps × {ts.sets || '–'} sets
                        <span className="chip muted" style={{ marginLeft: '0.4rem' }}>{ts.segment}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="button-row">
                <button type="button" onClick={() => useTemplate(tmpl)} disabled={isSubmitting}>
                  Use Template
                </button>
                <button type="button" className="delete-btn" onClick={() => setDeletingId(tmpl.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete template?"
          message="This will permanently remove this workout template."
          onConfirm={() => deleteTemplate(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </section>
  );
}
