import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

const FEATURES = [
  { icon: '📊', title: 'Progress Tracking', desc: 'Track volume, estimated 1RM, and detect plateaus automatically.' },
  { icon: '🏋️', title: 'Workout Logging', desc: 'Log sets, reps, and weight with an intuitive interface.' },
  { icon: '🎯', title: 'Goals & Streaks', desc: 'Set training targets and build consistency over time.' },
  { icon: '📋', title: 'Workout Templates', desc: 'Save your favourite routines and start workouts in one click.' },
  { icon: '🤖', title: 'AI Coach', desc: 'Get form tips, parse workouts from text, and personalized coaching.' },
  { icon: '💪', title: 'Body Metrics', desc: 'Track weight, body fat, and muscle mass over time with charts.' },
];

const SOCIAL_PROOF = [
  { stat: '1,000+', label: 'Workouts logged' },
  { stat: '500+', label: 'Active lifters' },
  { stat: '10K+', label: 'Sets tracked' },
];

export default function LandingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Train with Clarity.<br />Improve with Data.</h1>
          <p className="hero-sub">
            Every workout becomes a signal: volume, strength, trend, and plateau
            detection — all in one place.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-accent btn-lg">Start Free</Link>
            <Link to="/pricing" className="btn btn-outline btn-lg">See Pricing</Link>
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
        <h2>Everything you need to level up</h2>
        <p className="features-sub">Free to start, Pro to dominate.</p>
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
        <h2>Ready to forge your path?</h2>
        <p>Join hundreds of lifters tracking smarter, not harder.</p>
        <Link to="/register" className="btn btn-accent btn-lg">Create Free Account</Link>
      </section>
    </PublicLayout>
  );
}
