import { useEffect, useRef, useState } from 'react';

import api from '../api/client';
import EmptyState from '../components/EmptyState';
import FeatureGate from '../components/FeatureGate';
import { useToast } from '../hooks/useToast';

export default function AICoachPage() {
  const { addToast } = useToast();
  const [available, setAvailable] = useState(null);
  const [model, setModel] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [style, setStyle] = useState('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [tipsExercise, setTipsExercise] = useState('');
  const [parseText, setParseText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/ai/status')
      .then((res) => {
        setAvailable(res.data.available);
        setModel(res.data.model || '');
      })
      .catch(() => setAvailable(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendChat = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg, style });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch (err) {
      const detail = err.response?.data?.detail || 'AI request failed';
      setMessages((prev) => [...prev, { role: 'error', text: detail }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getExerciseTips = async (e) => {
    e.preventDefault();
    if (!tipsExercise.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await api.post('/ai/exercise-tips', { exercise_name: tipsExercise.trim() });
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: `Tips for: ${tipsExercise.trim()}` },
        { role: 'assistant', text: res.data.reply },
      ]);
      setTipsExercise('');
      setActiveTab('chat');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to get tips', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const parseWorkout = async (e) => {
    e.preventDefault();
    if (!parseText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await api.post('/ai/parse-workout', { text: parseText.trim() });
      const exercises = res.data.exercises;
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: `Parse workout:\n${parseText.trim()}` },
        {
          role: 'assistant',
          text: `Parsed ${exercises.length} exercise(s):\n\n${exercises
            .map((ex) => `• ${ex.name} — ${ex.sets}×${ex.reps}${ex.weight ? ` @ ${ex.weight}` : ''}`)
            .join('\n')}`,
          parsed: exercises,
        },
      ]);
      setParseText('');
      setActiveTab('chat');
      addToast(`Parsed ${exercises.length} exercise(s)`, 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to parse workout', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const useParsedWorkout = (exercises) => {
    const rows = exercises.map((ex) => ({
      exercise_id: '',
      exercise_name: ex.name,
      weight: ex.weight != null ? String(ex.weight) : '',
      reps: String(ex.reps || 10),
      sets: String(ex.sets || 3),
    }));
    sessionStorage.setItem('ai_parsed_workout', JSON.stringify(rows));
    addToast('Workout saved — go to Workouts page to use it', 'info');
  };

  if (available === null) {
    return (
      <FeatureGate feature="AI Coach">
        <section className="panel fade-in"><p style={{ color: 'var(--text-muted)' }}>Checking AI availability…</p></section>
      </FeatureGate>
    );
  }

  if (!available) {
    return (
      <FeatureGate feature="AI Coach">
        <section className="panel fade-in">
          <EmptyState
            icon="🤖"
          title="AI Coach Not Available"
          description="The GROQ_API_KEY is not configured on the server. Add it to the backend .env file to enable AI features."
        />
      </section>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="AI Coach">
    <section className="panel fade-in">
      <div className="panel-heading">
        <h2>AI Coach</h2>
        <p>Ask questions about exercises, parse workouts, and get personalized coaching. Powered by {model}.</p>
      </div>

      <div className="tab-bar">
        {['chat', 'exercise tips', 'parse workout'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab-btn${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'chat' ? '💬 Chat' : tab === 'exercise tips' ? '🎯 Exercise Tips' : '📋 Parse Workout'}
          </button>
        ))}
      </div>

      {/* ── Chat Messages ─────────────────────────── */}
      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <div className="ai-empty">
            <p>👋 Hi! I'm your AI training coach. Ask me anything about:</p>
            <ul>
              <li>Exercise form and technique</li>
              <li>Programming and periodization</li>
              <li>Warm-up and mobility routines</li>
              <li>Nutrition basics for training</li>
            </ul>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-msg ai-msg-${msg.role}`}>
            <div className="ai-msg-bubble">
              {msg.text.split('\n').map((line, j) => (
                <p key={j}>{line}</p>
              ))}
              {msg.parsed && (
                <button
                  type="button"
                  className="ghost-btn"
                  style={{ marginTop: '0.5rem', width: 'auto' }}
                  onClick={() => useParsedWorkout(msg.parsed)}
                >
                  Use This Workout →
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="ai-msg ai-msg-assistant">
            <div className="ai-msg-bubble ai-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Tab Forms ─────────────────────────────── */}
      {activeTab === 'chat' && (
        <form className="ai-input-bar" onSubmit={sendChat}>
          <select value={style} onChange={(e) => setStyle(e.target.value)} style={{ width: 'auto' }}>
            <option value="motivational">🔥 Motivational</option>
            <option value="balanced">⚖️ Balanced</option>
            <option value="tough">💪 Tough Love</option>
          </select>
          <input
            type="text"
            placeholder="Ask your AI coach…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? '…' : 'Send'}
          </button>
        </form>
      )}

      {activeTab === 'exercise tips' && (
        <form className="ai-input-bar" onSubmit={getExerciseTips}>
          <input
            type="text"
            placeholder="Exercise name, e.g. Bench Press"
            value={tipsExercise}
            onChange={(e) => setTipsExercise(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <button type="submit" disabled={isLoading || !tipsExercise.trim()}>
            {isLoading ? '…' : 'Get Tips'}
          </button>
        </form>
      )}

      {activeTab === 'parse workout' && (
        <form className="ai-parse-form" onSubmit={parseWorkout}>
          <textarea
            rows={6}
            placeholder={"Paste your workout here, e.g.:\nBench Press 3x10 @80kg\nSquat 5x5 @120kg\nPull Ups 4 sets of 8\nOr any freeform text…"}
            value={parseText}
            onChange={(e) => setParseText(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !parseText.trim()}>
            {isLoading ? 'Parsing…' : '🤖 Parse with AI'}
          </button>
        </form>
      )}
    </section>
    </FeatureGate>
  );
}
