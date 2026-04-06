import { useSubscription } from '../hooks/useSubscription';

export default function UsageMeter({ resource, label }) {
  const { limits, isPro } = useSubscription();

  if (!limits || isPro) return null;

  const usage = limits[resource];
  if (!usage || usage.limit === null) return null;

  const pct = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const atLimit = usage.used >= usage.limit;

  return (
    <div className="usage-meter">
      <div className="usage-meter-header">
        <span>{label || resource}</span>
        <span className={atLimit ? 'usage-meter-at-limit' : ''}>
          {usage.used} / {usage.limit}
        </span>
      </div>
      <div className="usage-meter-bar">
        <div
          className={`usage-meter-fill ${atLimit ? 'at-limit' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atLimit && (
        <p className="usage-meter-warning">
          Limit reached. <a href="/settings">Upgrade to Pro</a> for unlimited.
        </p>
      )}
    </div>
  );
}
