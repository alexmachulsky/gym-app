import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

const FEATURES = [
  { icon: '◐', title: 'Progress Volume', desc: 'Track tonnage, estimated 1RM, and detect plateaus before they sap your strength.' },
  { icon: '◇', title: 'Workout Logging', desc: 'Log sets, reps, and weight with a interface designed for the rack, not the desk.' },
  { icon: '◈', title: 'Goals & Streaks', desc: 'Define training targets. Build daily compounding consistency over months.' },
  { icon: '◆', title: 'Templates', desc: 'Save your favourite routines and start sessions with a single tap.' },
  { icon: '◌', title: 'AI Coach', desc: 'Get form tips, parse free-text workouts, and chat with your personal coach.' },
  { icon: '◉', title: 'Body Metrics', desc: 'Weight, body fat, muscle mass — plotted on a single timeline you control.' },
];

const SOCIAL_PROOF = [
  { stat: '1,240', label: 'Workouts logged' },
  { stat: '512', label: 'Active lifters' },
  { stat: '10K+', label: 'Sets tracked' },
];

export default function LandingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Train with <em>clarity.</em><br />
            Improve with data.
          </h1>
          <p className="hero-sub">
            Every workout becomes a signal — volume, strength, trend, and plateau detection.
            One ledger. One iron-clad source of truth.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-accent btn-lg">Begin Training</Link>
            <Link to="/pricing" className="btn btn-outline btn-lg">View Pricing</Link>
          </div>

          <div className="hero-meta">
            <div>
              Volume
              <strong>Issue 04</strong>
            </div>
            <div>
              Discipline
              <strong>Strength</strong>
            </div>
            <div>
              Edition
              <strong>2026</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="social-proof">
        {SOCIAL_PROOF.map((s) => (
          <div key={s.label} className="social-proof-item">
            <strong>{s.stat}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      {/* Features grid */}
      <section className="features-section">
        <h2>Everything you need <em>to level up.</em></h2>
        <p className="features-sub">Free to start. Pro to dominate.</p>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <h2>Ready to <em>forge</em> your path?</h2>
        <p>Join hundreds of lifters tracking smarter, not harder.</p>
        <Link to="/register" className="btn btn-accent btn-lg">Create Free Account</Link>
      </section>
    </PublicLayout>
  );
}
