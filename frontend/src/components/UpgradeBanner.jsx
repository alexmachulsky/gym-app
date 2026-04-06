import { useSubscription } from '../hooks/useSubscription';

export default function UpgradeBanner({ feature, children }) {
  const { isPro } = useSubscription();

  if (isPro) return children || null;

  return (
    <div className="upgrade-banner">
      <div className="upgrade-banner-content">
        <span className="upgrade-banner-icon">⚡</span>
        <div>
          <strong>{feature || 'This feature'} requires Pro</strong>
          <p>Upgrade to unlock unlimited access to all features.</p>
        </div>
        <a href="/settings" className="btn btn-accent btn-sm">Upgrade</a>
      </div>
    </div>
  );
}
