import Link from "next/link";
import { Container, Text } from "@/components/ui";
import { contactAddress, contactEmail, contactPhone, getFormations } from "@/lib/content";

const navLinks = [
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/formations", label: "Formations" },
  { href: "/actualites", label: "Actualités" },
  { href: "/contact", label: "Contact" },
];

const logoUrl = "https://oxideve.com/wp-content/uploads/2024/11/LOGO_OXIDEVE_BLANC_WEB_SVG.svg";

function categoryAnchor(category: string) {
  return `/formations#category-${category
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

export async function SiteFooter() {
  const formations = await getFormations();
  const categories = Array.from(new Set(formations.map((formation) => formation.category)));

  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <div className="brand-mark brand-mark-footer">
              <img alt="Oxideve" className="brand-logo brand-logo-footer" src={logoUrl} />
            </div>
            <Text className="site-footer-tagline" tone="inverse">Organisme de formation professionnelle généraliste : sécurité, bureautique, management, habilitations et énergies renouvelables.</Text>
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
              {categories.map((category) => (
                <Link href={categoryAnchor(category)} key={category}>
                  {category}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3>Contact</h3>
            <div className="site-footer-links">
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              <a href={`tel:${contactPhone.replace(/\s+/g, "")}`}>{contactPhone}</a>
              <span>{contactAddress}</span>
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
