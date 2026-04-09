/**
 * Reusable skeleton loading components with shimmer animation.
 * Usage:
 *   <Skeleton width="100%" height="1rem" />
 *   <SkeletonCard />
 *   <SkeletonStatGrid />
 */

export function Skeleton({ width = '100%', height = '1rem', borderRadius = '6px', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton width="60%" height="1.1rem" borderRadius="6px" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '40%' : '100%'}
          height="0.85rem"
          borderRadius="4px"
        />
      ))}
    </div>
  );
}

export function SkeletonStatGrid({ count = 3 }) {
  return (
    <div className="stats-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="stat-card skeleton-stat" key={i}>
          <Skeleton width="50%" height="0.75rem" />
          <Skeleton width="70%" height="1.5rem" style={{ marginTop: '0.4rem' }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4, cols = 4 }) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} width="80%" height="0.7rem" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div className="skeleton-table-row" key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} width={c === 0 ? '90%' : '60%'} height="0.8rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3 }) {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: items }, (_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}

export function PageSkeleton({ variant = 'default' }) {
  if (variant === 'settings') {
    return (
      <section className="panel fade-in">
        <div className="panel-heading">
          <Skeleton width="40%" height="1.3rem" />
          <Skeleton width="65%" height="0.85rem" style={{ marginTop: '0.5rem' }} />
        </div>
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </section>
    );
  }

  if (variant === 'cards') {
    return (
      <section className="panel fade-in">
        <div className="panel-heading">
          <Skeleton width="40%" height="1.3rem" />
          <Skeleton width="65%" height="0.85rem" style={{ marginTop: '0.5rem' }} />
        </div>
        <SkeletonStatGrid count={3} />
        <SkeletonList items={3} />
      </section>
    );
  }

  if (variant === 'admin') {
    return (
      <section className="panel fade-in">
        <div className="panel-heading">
          <Skeleton width="35%" height="1.3rem" />
          <Skeleton width="55%" height="0.85rem" style={{ marginTop: '0.5rem' }} />
        </div>
        <SkeletonStatGrid count={4} />
        <SkeletonTable rows={5} cols={5} />
      </section>
    );
  }

  return (
    <section className="panel fade-in">
      <div className="panel-heading">
        <Skeleton width="40%" height="1.3rem" />
        <Skeleton width="65%" height="0.85rem" style={{ marginTop: '0.5rem' }} />
      </div>
      <SkeletonStatGrid count={3} />
      <SkeletonCard lines={3} />
    </section>
  );
}
