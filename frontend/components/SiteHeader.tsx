import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand-mark">
          <span className="brand-badge">OXI</span>
          <span>
            <strong>Oxideve</strong>
            <small>Formation énergie & BTP</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Navigation principale">
          <Link href="/formations">Formations</Link>
          <Link href="/calendrier">Calendrier</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/contact" className="button button-primary">
            Demander un rappel
          </Link>
        </nav>
      </div>
    </header>
  );
}
