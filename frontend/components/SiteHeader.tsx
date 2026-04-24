"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui";

const navItems = [
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/formations", label: "Formations" },
  { href: "/rge", label: "RGE" },
  { href: "/actualites", label: "Actualités" },
];

const logoUrl = "https://oxideve.com/wp-content/uploads/2024/11/LOGO_OXIDEVE_BLANC_WEB_SVG.svg";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <Container className="site-header-shell">
        <div className="site-header-brand">
          <Link href="/" className="brand-mark" onClick={() => setOpen(false)}>
            <img alt="Oxideve" className="brand-logo" src={logoUrl} />
          </Link>
        </div>

        <button
          aria-expanded={open}
          aria-label="Ouvrir le menu"
          className="nav-toggle"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-panel${open ? " is-open" : ""}`}>
          <nav aria-label="Navigation principale" className="main-nav">
            {navItems.map((item) => (
              <Link className="main-nav-link" href={item.href} key={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="site-header-actions">
          <Link className="header-contact-link" href="/contact" onClick={() => setOpen(false)}>
            Contact
          </Link>
        </div>
      </Container>
    </header>
  );
}
