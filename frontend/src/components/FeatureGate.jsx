import { useSubscription } from '../hooks/useSubscription';
import UpgradeBanner from './UpgradeBanner';

export default function FeatureGate({ feature, children }) {
  const { isPro, isOnTrial, trialDaysLeft, loading } = useSubscription();

  if (loading) return null;
  if (isPro) {
    return (
      <>
        {isOnTrial && (
          <div className="trial-banner" role="status">
            Pro trial: <strong>{trialDaysLeft}</strong> day{trialDaysLeft === 1 ? '' : 's'} left.
            {' '}<a href="/settings">Subscribe</a> to keep full access.
          </div>
        )}
        {children}
      </>
    );
  }

  return <UpgradeBanner feature={feature} />;
}
