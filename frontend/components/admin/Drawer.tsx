"use client";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  return (
    <div className={`admin-drawer-root${open ? " is-open" : ""}`} aria-hidden={!open}>
      <div className="admin-drawer-overlay" onClick={onClose} />
      <aside className="admin-drawer-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="admin-drawer-header">
          <h2>{title}</h2>
          <button className="admin-drawer-close" onClick={onClose} type="button" aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="admin-drawer-body">{children}</div>
      </aside>
    </div>
  );
}
