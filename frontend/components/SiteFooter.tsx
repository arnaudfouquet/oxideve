import Link from "next/link";
import { Container, Text } from "@/components/ui";
import { contactEmail, contactPhone } from "@/lib/content";

const navLinks = [
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/formations", label: "Formations" },
  { href: "/rge", label: "RGE" },
  { href: "/actualites", label: "Actualités" },
  { href: "/contact", label: "Contact" },
];

const formationLinks = ["Photovoltaïque", "Pompe à chaleur", "Sécurité", "Bureautique", "IRVE"];

const logoUrl = "https://oxideve.com/wp-content/uploads/2024/11/LOGO_OXIDEVE_BLANC_WEB_SVG.svg";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <div className="brand-mark brand-mark-footer">
              <img alt="Oxideve" className="brand-logo brand-logo-footer" src={logoUrl} />
            </div>
            <Text tone="inverse">Organisme de formation professionnelle pour les métiers de l'énergie, du bâtiment et des services.</Text>
          </div>

          <div>
            <h3>Navigation</h3>
            <div className="site-footer-links">
              {navLinks.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3>Formations principales</h3>
            <div className="site-footer-links">
              {formationLinks.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>

          <div>
            <h3>Contact</h3>
            <div className="site-footer-links">
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              <a href={`tel:${contactPhone.replace(/\s+/g, "")}`}>{contactPhone}</a>
              <span>Rouen, Normandie</span>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/politique-confidentialite">Politique de confidentialité</Link>
        </div>
      </Container>
    </footer>
  );
}
