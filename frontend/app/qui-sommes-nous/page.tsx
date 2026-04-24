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
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
    items: [
      ["QualiPV Electricité 36 kVA", "/formations/formation-qualipv"],
      ["QualiPV Haute Puissance 500 kVA", "/formations/formation-qualipv-haute-puissance"],
      ["QualiPV Bâti", "/formations/formation-qualipv-bati"],
      ["Démarches administratives 36 kWC", "/formations/formation-demarches-administratives-36kwc"],
      ["Démarches administratives supérieur à 36 kVA", "/formations/formation-demarches-administratives-superieur-36kwc"],
      ["Module pose photovoltaïque", "/formations/formation-mise-en-service-certification-huawei"],
      ["Formation préparatoire au QUALIPV", "/formations/formation-qualipv-bati"],
      ["Vendre le solaire photovoltaïque niv 1", "/formations/formation-vendre-solaire-autoconsommation"],
      ["Vendre le solaire photovoltaïque niv 2", "/contact"],
    ],
  },
  {
    title: "Pompe à chaleur :",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
    items: [
      ["QualiPAC : pompe à chaleur en habitat individuel", "/formations/formation-qualipac"],
      ["Attestation Manipulation fluides frigorigènes", "/formations/formation-fluides-frigorigenes"],
      ["Les préludes de la YUTAKI", "/formations/formation-introduction-pac-yutaki"],
    ],
  },
  {
    title: "Sécurité :",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80",
    items: [
      ["Prévention des risques liés au travail en hauteur", "/formations/formation-travail-en-hauteur"],
      ["Habilitation électrique", "/formations/formation-habilitation-electrique"],
    ],
  },
  {
    title: "Véhicule électrique :",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba53b3f87?auto=format&fit=crop&w=1200&q=80",
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
              <div className="training-section-banner" style={{ backgroundImage: `linear-gradient(rgba(0, 77, 109, 0.78), rgba(0, 77, 109, 0.78)), url(${section.image})` }}>
                <h2>{section.title}</h2>
              </div>
              <div className="training-section-grid">
                {section.items.map(([label, href]) => (
                  <div className="training-tile" key={label}>
                    <h3>{label}</h3>
                    <ButtonLink className="ui-button-card" href={href} variant="secondary">Découvrir</ButtonLink>
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