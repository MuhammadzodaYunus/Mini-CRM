import { useEffect } from "react";
import "../../styles/resources.css";

function ResourceModal({
  open,
  title,
  description,
  children,
  submitLabel = "Сабт кардан",
  loading = false,
  onClose,
  onSubmit,
}) {
  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="resource-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="resource-modal" role="dialog" aria-modal="true">
        <header className="resource-modal-header">
          <div>
            <span className="resource-modal-eyebrow">FORM</span>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="resource-modal-close" onClick={onClose}>×</button>
        </header>

        <form className="resource-form" onSubmit={onSubmit}>
          <div className="resource-modal-body">{children}</div>
          <footer className="resource-modal-footer">
            <button type="button" className="resource-button resource-button-secondary" onClick={onClose} disabled={loading}>
              Бекор кардан
            </button>
            <button type="submit" className="resource-button resource-button-primary" disabled={loading}>
              {loading ? "Интизор шавед..." : submitLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default ResourceModal;
