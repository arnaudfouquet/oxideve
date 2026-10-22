import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { getSiteUrl } from "@/lib/content";
import { formatDateRange } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Votre dossier d'inscription",
  // Page personnelle, partagée par lien : elle n'a rien à faire dans Google.
  robots: { index: false, follow: false },
};

type Document = {
  id: string;
  label: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
};

type Dossier = {
  formation: { slug: string; title: string; duration: string } | null;
  session: { city: string; startDate: string; endDate: string; mode: string } | null;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  documents: Document[];
};

type Props = {
  params: Promise<{ token: string }>;
};

/** "182400" -> "178 Ko", pour situer le poids avant de télécharger. */
function formatSize(octets: number) {
  if (!octets) return "";
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

async function fetchDossier(token: string): Promise<Dossier | null> {
  const response = await fetch(`${getSiteUrl()}/api/dossier/${token}`, { cache: "no-store" });

  if (!response.ok) return null;

  const payload = (await response.json()) as { data: Dossier };
  return payload.data;
}

export default async function DossierPage({ params }: Props) {
  const { token } = await params;
  const dossier = await fetchDossier(token);

  if (!dossier) {
    notFound();
  }

  // Le bulletin est pré-rempli avec ce que l'admin connaît déjà du prospect.
  const bulletinParams = new URLSearchParams();
  if (dossier.formation) bulletinParams.set("formationSlug", dossier.formation.slug);
  if (dossier.companyName) bulletinParams.set("companyName", dossier.companyName);
  if (dossier.contactName) bulletinParams.set("sponsorFullName", dossier.contactName);
  if (dossier.contactEmail) bulletinParams.set("sponsorEmail", dossier.contactEmail);
  if (dossier.contactPhone) bulletinParams.set("sponsorPhone", dossier.contactPhone);

  return (
    <main className="ct-page">
      <section className="ct-hero">
        <Container className="ct-hero-inner">
          <h1 className="ct-hero-title">
            Votre <em>dossier d&apos;inscription</em>
          </h1>
          {dossier.formation ? (
            <p className="ct-hero-lead">
              {dossier.formation.title}
              {dossier.session ? (
                <>
                  <br />
                  {dossier.session.city} — {formatDateRange(dossier.session.startDate, dossier.session.endDate)}
                </>
              ) : null}
            </p>
          ) : null}
        </Container>
      </section>

      <Container className="dossier-layout">
        <section className="dossier-step">
          <span className="dossier-step-index">1</span>
          <div>
            <h2>Remplir le bulletin d&apos;inscription</h2>
            <p>
              Le formulaire est déjà pré-rempli avec vos coordonnées. Comptez cinq minutes, vous pouvez inscrire
              jusqu&apos;à trois participants.
            </p>
            <a className="ui-button ui-button-primary home-cta-arrow" href={`/bulletin-inscription?${bulletinParams}`}>
              Remplir le bulletin en ligne
            </a>
          </div>
        </section>

        <section className="dossier-step">
          <span className="dossier-step-index">2</span>
          <div>
            <h2>Consulter les documents</h2>
            {dossier.documents.length ? (
              <ul className="dossier-documents">
                {dossier.documents.map((document) => (
                  <li key={document.id}>
                    <a href={document.fileUrl} target="_blank" rel="noreferrer">
                      <span className="dossier-document-label">{document.label}</span>
                      {document.description ? (
                        <span className="dossier-document-note">{document.description}</span>
                      ) : null}
                      <span className="dossier-document-meta">
                        {document.fileName.split(".").pop()?.toUpperCase()}
                        {document.fileSize ? ` · ${formatSize(document.fileSize)}` : ""}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Les documents vous seront transmis prochainement par votre conseiller.</p>
            )}
          </div>
        </section>

        <aside className="dossier-help">
          <strong>Une question ?</strong>
          <p>
            Notre équipe vous accompagne dans vos démarches, y compris pour la prise en charge financière.
          </p>
          <p className="dossier-help-contact">
            <a href="tel:+33636445593">06.36.44.55.93</a>
            <a href="mailto:contact@oxideve.com">contact@oxideve.com</a>
          </p>
        </aside>
      </Container>
    </main>
  );
}
