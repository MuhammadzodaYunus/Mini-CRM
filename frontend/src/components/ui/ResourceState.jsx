import "../../styles/resources.css";

export function ResourceAlert({ type = "info", children, onClose }) {
  if (!children) return null;
  return (
    <div className={`resource-alert resource-alert-${type}`}>
      <span className="resource-alert-dot" />
      <p>{children}</p>
      {onClose && <button type="button" onClick={onClose}>×</button>}
    </div>
  );
}

export function ResourceLoading({ label = "Маълумот бор шуда истодааст..." }) {
  return (
    <div className="resource-loading">
      <span className="resource-spinner" />
      <p>{label}</p>
    </div>
  );
}

export function ResourceEmpty({ title = "Маълумот нест", description, actionLabel, onAction }) {
  return (
    <div className="resource-empty">
      <div className="resource-empty-icon">◇</div>
      <h3>{title}</h3>
      <p>{description || "Ҳоло ягон сабт вуҷуд надорад."}</p>
      {actionLabel && onAction && (
        <button type="button" className="resource-button resource-button-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
