import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description: "Découvrez Oxideve, son positionnement et ses grands univers de formation.",
};

const heroImage = "https://oxideve.com/wp-content/uploads/2024/10/Panneau-solaire-installateur-sur-un-toit-pose-photovoltaique-oxideve-200x300.webp";

const sections = [
  {
    title: "Photovoltaïque :",
    items: [
      ["QualiPV Electricité 36 kVA", "/formations/formation-qualipv"],
      ["QualiPV Haute Puissance 500 kVA", "/contact"],
      ["QualiPV Bâti", "/contact"],
      ["Démarches administratives 36 kWC", "/contact"],
      ["Démarches administratives supérieur à 36 kVA", "/contact"],
      ["Module pose photovoltaïque", "/contact"],
      ["Formation préparatoire au QUALIPV", "/contact"],
      ["Vendre le solaire photovoltaïque niv 1", "/contact"],
      ["Vendre le solaire photovoltaïque niv 2", "/contact"],
    ],
  },
  {
    title: "Pompe à chaleur :",
    items: [
      ["QualiPAC : pompe à chaleur en habitat individuel", "/formations/formation-qualipac"],
      ["Attestation Manipulation fluides frigorigènes", "/contact"],
      ["Les préludes de la YUTAKI", "/contact"],
    ],
  },
  {
    title: "Sécurité :",
    items: [
      ["Prévention des risques liés au travail en hauteur", "/contact"],
      ["Habilitation électrique", "/contact"],
    ],
  },
  {
    title: "Véhicule électrique :",
    items: [["Infrastructures de recharges pour véhicules électriques", "/formations/formation-irve"]],
  },
];

export default function QuiSommesNousPage() {
  return (
    <>
      <section className="about-hero" style={{ backgroundImage: `linear-gradient(rgba(0, 77, 109, 0.82), rgba(0, 77, 109, 0.82)), url(${heroImage})` }}>
        <div className="container about-hero-inner">
          <h1>Votre organisme de formation professionnel</h1>
        </div>
      </section>

      <section className="section">
        <div className="container about-intro-grid">
          <div>
            <h2>Pourquoi vous former avec OXIDEVE ?</h2>
            <p>Oxideve accompagne les professionnels qui souhaitent renforcer leurs compétences sur les métiers de l'énergie, du bâtiment et de l'installation.</p>
            <p>Nos programmes sont pensés pour associer pratique, réglementation, lecture technique et progression concrète sur le terrain.</p>
            <ul>
              <li>Formations métier courtes et applicables</li>
              <li>Plateaux techniques et cas concrets</li>
              <li>Accompagnement sur plusieurs univers techniques</li>
            </ul>
          </div>
          <div className="about-wheel">
            <div className="day-type-wheel">
              <span>☀</span>
              <span>🔥</span>
              <span>⛑</span>
              <span>🔌</span>
              <strong>?</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container training-section-stack">
          {sections.map((section) => (
            <article className="training-section-block" key={section.title}>
              <div className="training-section-banner" style={{ backgroundImage: `linear-gradient(rgba(0, 77, 109, 0.78), rgba(0, 77, 109, 0.78)), url(${heroImage})` }}>
                <h2>{section.title}</h2>
              </div>
              <div className="training-section-grid">
                {section.items.map(([label, href]) => (
                  <div className="training-tile" key={label}>
                    <h3>{label}</h3>
                    <ButtonLink href={href} variant="secondary">Découvrir</ButtonLink>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}