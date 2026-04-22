"use client";

import Link from "next/link";
import { useState } from "react";
import { ButtonLink, Container } from "@/components/ui";

const navItems = [
  { href: "/formations", label: "Formations" },
  { href: "/rge", label: "RGE" },
  { href: "/actualites", label: "Actualités" },
  { href: "/campus", label: "Campus" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <Container className="site-header-shell">
        <Link href="/" className="brand-mark" onClick={() => setOpen(false)}>
          <span className="brand-badge">OXI</span>
          <span className="brand-copy">
            <strong>Oxideve</strong>
            <small>Formation énergie & BTP</small>
          </span>
        </Link>

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
          <ButtonLink className="header-cta" href="/inscriptions" variant="primary">
            Je m&apos;inscris
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
