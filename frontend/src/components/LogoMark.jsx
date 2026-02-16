export default function LogoMark({ compact = false }) {
  return (
    <div className={`logo-mark${compact ? ' compact' : ''}`}>
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <defs>
          <linearGradient id="logoGradient" x1="20" y1="20" x2="160" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F97316" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <rect x="12" y="12" width="156" height="156" rx="40" fill="#0B1220" />
        <rect x="30" y="82" width="120" height="16" rx="8" fill="url(#logoGradient)" />
        <rect x="22" y="70" width="16" height="40" rx="7" fill="#F97316" />
        <rect x="142" y="70" width="16" height="40" rx="7" fill="#06B6D4" />
        <circle cx="90" cy="54" r="14" fill="#F8FAFC" />
        <rect x="76" y="68" width="28" height="44" rx="12" fill="#F8FAFC" />
      </svg>
      <div>
        <p>ForgeMode</p>
        {!compact && <span>Smart Gym Progress Tracker</span>}
      </div>
    </div>
  );
}
