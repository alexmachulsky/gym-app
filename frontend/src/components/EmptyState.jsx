export default function EmptyState({ icon, title, description, cta }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {cta && <div className="empty-state-cta">{cta}</div>}
    </div>
  );
}
