import PublicLayout from '../components/PublicLayout';

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <section className="legal-page">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: April 2026</p>

        <h2>1. Information We Collect</h2>
        <p>We collect the information you provide when creating an account (email address) and the fitness data you enter (workouts, body metrics, exercises, goals). We also collect basic usage analytics such as page views and feature usage.</p>

        <h2>2. How We Use Your Data</h2>
        <p>Your fitness data is used solely to provide the Service — displaying your workouts, calculating progress, detecting plateaus, and powering AI features. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>

        <h2>3. AI Features</h2>
        <p>When you use the AI Coach, your messages and workout data are sent to our AI provider (Groq) for processing. These interactions are not stored by the AI provider beyond the duration of the request.</p>

        <h2>4. Payment Information</h2>
        <p>Payments are processed by Stripe. We do not store your credit card details. Stripe's privacy policy governs the handling of your payment information.</p>

        <h2>5. Data Storage & Security</h2>
        <p>Your data is stored in encrypted databases. All communications between your browser and our servers are encrypted using TLS. We implement industry-standard security measures to protect your data.</p>

        <h2>6. Data Retention</h2>
        <p>Your data is retained as long as your account is active. If you delete your account, all associated data is permanently removed within 30 days.</p>

        <h2>7. Your Rights</h2>
        <p>You have the right to: access your data, export your data in CSV format, correct inaccurate data, and delete your account and all associated data at any time from your account settings.</p>

        <h2>8. Cookies</h2>
        <p>We use essential cookies (JWT tokens stored in localStorage) for authentication. We do not use third-party tracking cookies.</p>

        <h2>9. Changes to This Policy</h2>
        <p>We may update this policy from time to time. We will notify you of material changes via email or in-app notification.</p>

        <h2>10. Contact</h2>
        <p>Questions about your privacy? Contact us at privacy@forgemode.app.</p>
      </section>
    </PublicLayout>
  );
}
