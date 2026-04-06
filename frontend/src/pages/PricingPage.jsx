import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

const PLANS = {
  monthly: { price: '$4.99', period: '/mo', badge: '' },
  yearly: { price: '$29.99', period: '/yr', badge: 'Save 50%' },
};

const FREE_FEATURES = [
  'Unlimited workout logging',
  'Basic progress charts (last 10 sessions)',
  'Up to 10 custom exercises',
  'Up to 3 workout templates',
  'Up to 2 goals',
  'Body weight tracking',
  'Personal records',
];

const PRO_FEATURES = [
  'Everything in Free, plus:',
  'Unlimited exercises, templates & goals',
  'AI Coach — chat, tips, workout parsing',
  'Workout generator',
  'Muscle group analytics',
  'Recovery tracking',
  'CSV data export',
  'Equipment profiles',
  'Body fat & muscle mass tracking',
  'Priority support',
];

const FAQ = [
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your billing settings and keep Pro features until the end of your billing cycle.' },
  { q: 'Is my data safe?', a: 'Absolutely. Your data is encrypted at rest and in transit. You can export or delete it anytime.' },
  { q: 'What happens when I hit a free limit?', a: "You'll see a gentle prompt to upgrade. Your existing data is never deleted." },
  { q: 'Do you offer refunds?', a: "We offer a full refund within 7 days of your first payment if you're not satisfied." },
];

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly');

  return (
    <PublicLayout>
      <section className="pricing-hero">
        <h1>Simple, honest pricing</h1>
        <p>Start free, upgrade when you're ready.</p>

        <div className="billing-toggle">
          <button
            className={billing === 'monthly' ? 'active' : ''}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button
            className={billing === 'yearly' ? 'active' : ''}
            onClick={() => setBilling('yearly')}
          >
            Yearly
            {PLANS.yearly.badge && <span className="billing-badge">{PLANS.yearly.badge}</span>}
          </button>
        </div>
      </section>

      <section className="pricing-cards">
        {/* Free */}
        <div className="pricing-card">
          <h3>Free</h3>
          <div className="pricing-price">
            <span className="price-amount">$0</span>
            <span className="price-period">forever</span>
          </div>
          <ul className="pricing-features">
            {FREE_FEATURES.map((f) => <li key={f}>✓ {f}</li>)}
          </ul>
          <Link to="/register" className="btn btn-outline btn-block">Get Started</Link>
        </div>

        {/* Pro */}
        <div className="pricing-card pricing-card-pro">
          <div className="pricing-popular">Most Popular</div>
          <h3>Pro</h3>
          <div className="pricing-price">
            <span className="price-amount">{PLANS[billing].price}</span>
            <span className="price-period">{PLANS[billing].period}</span>
          </div>
          <ul className="pricing-features">
            {PRO_FEATURES.map((f) => <li key={f}>✓ {f}</li>)}
          </ul>
          <Link to="/register" className="btn btn-accent btn-block">Start Pro</Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="pricing-faq">
        <h2>Frequently asked questions</h2>
        <div className="faq-grid">
          {FAQ.map((item) => (
            <div key={item.q} className="faq-item">
              <h4>{item.q}</h4>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
