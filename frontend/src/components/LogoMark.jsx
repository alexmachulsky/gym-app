export default function LogoMark({ compact = false, hideLabel = false }) {
  return (
    <div className={`logo-mark${compact ? ' compact' : ''}`}>
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <defs>
          <linearGradient id="logoGradient" x1="20" y1="20" x2="160" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c4f041" />
            <stop offset="1" stopColor="#d4ff5a" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="168" height="168" rx="14" fill="#15130f" stroke="#2a2620" strokeWidth="2" />
        {/* barbell bar */}
        <rect x="22" y="84" width="136" height="12" rx="2" fill="url(#logoGradient)" />
        {/* outer plates */}
        <rect x="14" y="62" width="14" height="56" rx="2" fill="#c4f041" />
        <rect x="152" y="62" width="14" height="56" rx="2" fill="#c4f041" />
        {/* inner plates */}
        <rect x="32" y="72" width="10" height="36" rx="1" fill="#f3ede1" />
        <rect x="138" y="72" width="10" height="36" rx="1" fill="#f3ede1" />
        {/* small index mark */}
        <rect x="86" y="22" width="8" height="32" rx="1" fill="#c4f041" />
      </svg>
      {!hideLabel && (
        <div>
          <p>FORGEMODE</p>
          {!compact && <span>EST · 2026 · IRON WORK</span>}
        </div>
      )}
    </div>
  );
}
