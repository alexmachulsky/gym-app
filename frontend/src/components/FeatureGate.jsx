import { useSubscription } from '../hooks/useSubscription';
import UpgradeBanner from './UpgradeBanner';

export default function FeatureGate({ feature, children }) {
  const { isPro, loading } = useSubscription();

  if (loading) return null;
  if (isPro) return children;

  return <UpgradeBanner feature={feature} />;
}
