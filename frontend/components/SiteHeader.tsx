"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui";

const navItems = [
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/formations", label: "Formations" },
  { href: "/financement", label: "Financement" },
  { href: "/actualites", label: "Actualités" },
];

const logoUrl = "https://oxideve.com/wp-content/uploads/2024/11/LOGO_OXIDEVE_BLANC_WEB_SVG.svg";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Le menu mobile couvre l'ecran : on bloque le defilement derriere lui et
  // on le referme a la touche Echap, comme attendu d'un panneau modal.
  useEffect(() => {
    if (!open) return undefined;

    const precedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const fermer = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", fermer);

    return () => {
      document.body.style.overflow = precedent;
      window.removeEventListener("keydown", fermer);
    };
  }, [open]);

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
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className={`nav-toggle${open ? " is-open" : ""}`}
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        {/* Voile cliquable : fermer en touchant a cote est le geste attendu. */}
        <div
          className={`nav-overlay${open ? " is-open" : ""}`}
          onClick={() => setOpen(false)}
          role="presentation"
        />

        <div className={`nav-panel${open ? " is-open" : ""}`}>
          <nav aria-label="Navigation principale" className="main-nav">
            {navItems.map((item) => (
              <Link className="main-nav-link" href={item.href} key={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Repris dans le panneau : hors de lui, il disparaissait du menu
              ouvert sur mobile. */}
          <Link className="nav-panel-cta" href="/contact" onClick={() => setOpen(false)}>
            Nous contacter
          </Link>

          <div className="nav-panel-contact">
            <a href="tel:+33636445593">06.36.44.55.93</a>
            <a href="mailto:contact@oxideve.com">contact@oxideve.com</a>
          </div>
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
