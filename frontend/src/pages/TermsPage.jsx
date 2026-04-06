import PublicLayout from '../components/PublicLayout';

export default function TermsPage() {
  return (
    <PublicLayout>
      <section className="legal-page">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: April 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using ForgeMode ("the Service"), you agree to be bound by these terms. If you do not agree, do not use the Service.</p>

        <h2>2. Description of Service</h2>
        <p>ForgeMode is a fitness tracking web application that allows users to log workouts, track body metrics, analyse progress, and receive AI-powered coaching. The Service is offered in Free and Pro subscription tiers.</p>

        <h2>3. Accounts</h2>
        <p>You must provide a valid email address and create a password to register. You are responsible for maintaining the confidentiality of your account credentials. You must be at least 16 years old to use the Service.</p>

        <h2>4. Subscriptions & Billing</h2>
        <p>Pro subscriptions are billed monthly or annually through Stripe. You may cancel at any time from your account settings. Cancellation takes effect at the end of the current billing period. Refunds are available within 7 days of your first payment.</p>

        <h2>5. User Data</h2>
        <p>You retain ownership of all data you enter into the Service. We do not sell your data to third parties. You may export or delete your data at any time. See our Privacy Policy for details on data handling.</p>

        <h2>6. Acceptable Use</h2>
        <p>You agree not to misuse the Service, including: attempting to gain unauthorized access, interfering with other users, or using automated means to access the Service beyond normal API usage.</p>

        <h2>7. Limitation of Liability</h2>
        <p>The Service is provided "as is" without warranties of any kind. ForgeMode is not a medical or professional fitness advice service. Always consult a qualified professional before starting a new exercise program.</p>

        <h2>8. Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>

        <h2>9. Contact</h2>
        <p>Questions about these terms? Contact us at support@forgemode.app.</p>
      </section>
    </PublicLayout>
  );
}
