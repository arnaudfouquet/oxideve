import { ContactForm } from "@/components/ContactForm";
import { FormationCard } from "@/components/FormationCard";
import { SessionCard } from "@/components/SessionCard";
import { Badge, ButtonLink, Container, Section, Text, Title } from "@/components/ui";
import { getFormations, getSessions, siteDescription } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const formations = await getFormations();
  const sessions = (await getSessions()).slice(0, 3);
  const categories = Array.from(new Set(formations.map((formation) => formation.category))).map((category) => ({
    name: category,
    count: formations.filter((formation) => formation.category === category).length,
  }));
  const keyFigures = [
    { value: `${formations.length}`, label: "formations actives" },
    { value: `${sessions.length}`, label: "sessions visibles" },
    { value: "93 %", label: "reussite moyenne" },
    { value: "48 h", label: "delai moyen de reponse" },
  ];

  return (
    <>
      <Section className="home-hero">
        <Container className="hero-shell hero-shell-grid">
          <div className="hero-copy">
            <Badge tone="accent">Formations energie, electricite et CVC</Badge>
            <Title
              as="h1"
              title="Un catalogue terrain pour former vite, cadrer juste et planifier sans friction."
              description={`${siteDescription} Chaque parcours reprend la meme structure : objectifs, modalites, programme, sessions et conditions d'inscription.`}
            />
            <div className="hero-actions">
              <ButtonLink href="/formations" variant="primary">Explorer les formations</ButtonLink>
              <ButtonLink href="/inscriptions" variant="secondary">Je m'inscris</ButtonLink>
            </div>
            <div className="hero-stat-row">
              {keyFigures.map((item) => (
                <div className="hero-stat" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-panel-grid">
            <div className="hero-panel hero-panel-large">
              <span className="hero-panel-label">Pourquoi Oxideve</span>
              <p>Des fiches formation lisibles, des sessions exploitables par les equipes et une logique de parcours qui colle au chantier.</p>
            </div>
            <div className="hero-panel-list">
              <div className="hero-panel">
                <strong>Catalogue clair</strong>
                <p>Comparaison rapide des formations sans habillage inutile.</p>
              </div>
              <div className="hero-panel">
                <strong>Planning reel</strong>
                <p>Les prochaines sessions sont reliees a la bonne fiche formation.</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Title
            eyebrow="Categories"
            title="Un catalogue organise par familles de decisions terrain"
            description="Les pages publiques repartent toujours des memes composants pour garder une lecture stable du catalogue jusqu'a l'inscription."
            actions={<ButtonLink href="/formations" variant="secondary">Voir tout le catalogue</ButtonLink>}
          />
          <div className="category-grid">
            {categories.map((category) => (
              <div className="category-card" key={category.name}>
                <strong>{category.name}</strong>
                <span>{category.count} parcours</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section surface="muted">
        <Container>
          <Title eyebrow="Chiffres cles" title="Des indicateurs visibles avant meme d'ouvrir le back-office" />
          <div className="metric-grid">
            {keyFigures.map((item) => (
              <div className="metric-card" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Title eyebrow="Pourquoi Oxideve" title="Une meme logique de lecture du site jusqu'a la fiche detail" />
          <div className="value-grid">
            <div className="value-card">
              <h3>Descriptions actionnables</h3>
              <Text tone="muted">Chaque formation affiche les pre requis, les objectifs, les modalites et le programme sur le meme squelette.</Text>
            </div>
            <div className="value-card">
              <h3>Sessions reliees au reel</h3>
              <Text tone="muted">La lecture des prochaines dates se fait sans quitter l'univers de la formation concernee.</Text>
            </div>
            <div className="value-card">
              <h3>Back-office unifie</h3>
              <Text tone="muted">Le catalogue public et l'administration convergent vers les memes entites : formations, sessions, inscriptions et contenu editorial.</Text>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Title eyebrow="Sessions" title="Les prochaines ouvertures de session" actions={<ButtonLink href="/formations" variant="secondary">Toutes les formations</ButtonLink>} />
          <div className="session-grid">
            {sessions.map((session) => (
              <SessionCard key={session.id} compact formation={formations.find((formation) => formation.slug === session.formationSlug)} session={session} />
            ))}
          </div>
        </Container>
      </Section>

      <Section surface="contrast">
        <Container>
          <div className="spotlight-grid">
            <div>
              <Title eyebrow="Bloc RGE" title="Un espace public qui prepare deja la logique RGE" description="Qualifications, preuves d'execution, dossier technique, autocontrôle et remise d'elements au client : tout le vocabulaire RGE traverse les parcours et les articles." />
            </div>
            <div className="spotlight-card-list">
              <div className="spotlight-card">
                <strong>Formations RGE</strong>
                <p>Photovoltaique et PAC sont presentes avec les attendus de qualification et les points de conformite utiles.</p>
              </div>
              <div className="spotlight-card">
                <strong>Documentation chantier</strong>
                <p>Le site editorial reprend les routines de controle et de transmission attendues sur le terrain.</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Title eyebrow="Parcours" title="Trois facons d'entrer dans l'offre" />
          <div className="path-grid">
            <div className="path-card">
              <span>01</span>
              <h3>Comparer</h3>
              <p>Explorer les categories, filtrer, puis ouvrir la fiche formation detaillee.</p>
            </div>
            <div className="path-card">
              <span>02</span>
              <h3>Planifier</h3>
              <p>Choisir une session visible et valider les contraintes de calendrier, lieu et format.</p>
            </div>
            <div className="path-card">
              <span>03</span>
              <h3>Inscrire</h3>
              <p>Envoyer la demande depuis un point d'entree clair, sans naviguer entre plusieurs formulaires disjoints.</p>
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="muted">
        <Container>
          <Title eyebrow="Quiz" title="Par ou commencer ?" description="Trois portes d'entree simples pour orienter le bon parcours sans rendre le site artificiellement complexe." />
          <div className="quiz-grid">
            <div className="quiz-card">
              <h3>Votre besoin est une qualification ou un maintien de niveau ?</h3>
              <ButtonLink href="/rge" variant="ghost">Voir le parcours RGE</ButtonLink>
            </div>
            <div className="quiz-card">
              <h3>Vous cherchez d'abord une date pour monter une equipe ?</h3>
              <ButtonLink href="/formations" variant="ghost">Filtrer les sessions</ButtonLink>
            </div>
            <div className="quiz-card">
              <h3>Vous avez besoin d'un format intra ou d'un cadrage pedagogique ?</h3>
              <ButtonLink href="/contact" variant="ghost">Contacter Oxideve</ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Title eyebrow="Catalogue" title="Quelques formations a la une" />
          <div className="training-showcase-grid">
            {formations.slice(0, 3).map((formation) => (
              <FormationCard formation={formation} key={formation.slug} tone="highlight" />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="contact-layout contact-layout-modern">
          <div className="contact-card contact-card-copy">
            <Title eyebrow="Contact" title="Une question sur un pre requis, un rythme ou un montage intra ?" />
            <Text tone="muted" size="lg">Le formulaire ci-contre reste le point d'entree unique pour demander un rappel ou cadrer une inscription.</Text>
          </div>
          <div className="contact-card contact-card-form">
            <ContactForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
