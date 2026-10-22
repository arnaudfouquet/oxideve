"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { Formation } from "../../../shared/types";

type Document = {
  id: string;
  label: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  formationSlug: string;
  position: number;
  published: boolean;
};

type Template = {
  subject: string;
  body: string;
  formationSlug: string;
  custom?: boolean;
};

/** "182400" -> "178 Ko" */
function formatSize(octets: number) {
  if (!octets) return "";
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

const VARIABLES = [
  { cle: "{{formation}}", libelle: "Intitulé de la formation" },
  { cle: "{{ville}}", libelle: "Ville de la session" },
  { cle: "{{dates}}", libelle: "Dates de la session" },
  { cle: "{{contact}}", libelle: "Nom du contact" },
  { cle: "{{societe}}", libelle: "Nom de la société" },
  { cle: "{{lien_dossier}}", libelle: "Lien vers le dossier" },
];

/**
 * Ecran « Dossiers » : les documents joints au dossier d'inscription et le
 * modele de message envoye aux prospects.
 */
export function InscriptionDocumentsPanel({
  formations,
  onError,
  onFeedback,
}: {
  formations: Formation[];
  onError: (message: string) => void;
  onFeedback: (message: string) => void;
}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [templateScope, setTemplateScope] = useState("");
  const [template, setTemplate] = useState<Template>({ subject: "", body: "", formationSlug: "" });

  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  async function reloadDocuments() {
    const response = await fetch("/api/admin/inscription-documents");

    if (!response.ok) {
      onError("Les documents n'ont pas pu être chargés.");
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as { data: Document[] };
    setDocuments(payload.data);
    setLoading(false);
  }

  async function reloadTemplate(slug: string) {
    const response = await fetch(`/api/admin/inscription-templates?formationSlug=${encodeURIComponent(slug)}`);

    if (!response.ok) {
      onError("Le modèle de message n'a pas pu être chargé.");
      return;
    }

    const payload = (await response.json()) as { data: { effective: Template } };
    setTemplate({ ...payload.data.effective, formationSlug: slug });
  }

  useEffect(() => {
    reloadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadTemplate(templateScope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateScope]);

  const communs = useMemo(() => documents.filter((item) => !item.formationSlug), [documents]);
  const specifiques = useMemo(() => documents.filter((item) => item.formationSlug), [documents]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const fichier = fileRef.current?.files?.[0];

    if (!fichier) {
      onError("Choisissez un fichier à déposer.");
      return;
    }

    setUploading(true);

    const body = new FormData(form);
    body.set("document", fichier);

    const response = await fetch("/api/admin/inscription-documents", { method: "POST", body });

    setUploading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      onError(data?.error || "Le document n'a pas pu être ajouté.");
      return;
    }

    form.reset();
    await reloadDocuments();
    onFeedback("Document ajouté");
  }

  async function togglePublished(document: Document) {
    const response = await fetch(`/api/admin/inscription-documents/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !document.published }),
    });

    if (!response.ok) {
      onError("Le document n'a pas pu être mis à jour.");
      return;
    }

    setDocuments((current) =>
      current.map((item) => (item.id === document.id ? { ...item, published: !item.published } : item)),
    );
  }

  async function removeDocument(document: Document) {
    if (!window.confirm(`Supprimer définitivement « ${document.label} » ?`)) return;

    const response = await fetch(`/api/admin/inscription-documents/${document.id}`, { method: "DELETE" });

    if (!response.ok) {
      onError("Le document n'a pas pu être supprimé.");
      return;
    }

    setDocuments((current) => current.filter((item) => item.id !== document.id));
    onFeedback("Document supprimé");
  }

  async function saveTemplate() {
    setSaving(true);

    const response = await fetch("/api/admin/inscription-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formationSlug: templateScope,
        subject: template.subject,
        body: template.body,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      onError("Le modèle n'a pas pu être enregistré.");
      return;
    }

    onFeedback("Modèle enregistré");
    await reloadTemplate(templateScope);
  }

  /** Insere la variable a l'endroit du curseur, pas a la fin du texte. */
  function insertVariable(variable: string) {
    const champ = bodyRef.current;

    if (!champ) {
      setTemplate((current) => ({ ...current, body: current.body + variable }));
      return;
    }

    const debut = champ.selectionStart ?? champ.value.length;
    const fin = champ.selectionEnd ?? debut;
    const texte = champ.value.slice(0, debut) + variable + champ.value.slice(fin);

    setTemplate((current) => ({ ...current, body: texte }));

    requestAnimationFrame(() => {
      champ.focus();
      champ.setSelectionRange(debut + variable.length, debut + variable.length);
    });
  }

  function renderDocuments(liste: Document[]) {
    return (
      <ul className="admin-doc-list">
        {liste.map((document) => (
          <li className={`admin-doc${document.published ? "" : " is-hidden"}`} key={document.id}>
            <div className="admin-doc-main">
              <a href={document.fileUrl} target="_blank" rel="noreferrer">
                {document.label}
              </a>
              {document.description ? <span className="admin-doc-note">{document.description}</span> : null}
              <span className="admin-doc-meta">
                {document.fileName.split(".").pop()?.toUpperCase()}
                {document.fileSize ? ` · ${formatSize(document.fileSize)}` : ""}
                {document.formationSlug
                  ? ` · ${formations.find((f) => f.slug === document.formationSlug)?.title.trim() || document.formationSlug}`
                  : ""}
              </span>
            </div>
            <div className="admin-doc-actions">
              <button className="admin-copy-button" onClick={() => togglePublished(document)} type="button">
                {document.published ? "Masquer" : "Afficher"}
              </button>
              <button
                className="admin-copy-button admin-copy-button-danger"
                onClick={() => removeDocument(document)}
                type="button"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (loading) {
    return <p className="admin-empty">Chargement des documents...</p>;
  }

  return (
    <div className="admin-editorial">
      <div className="admin-editorial-head">
        <div>
          <h2>Dossiers d&apos;inscription</h2>
          <span>
            {documents.length} document{documents.length > 1 ? "s" : ""} · {communs.length} commun
            {communs.length > 1 ? "s" : ""} à toutes les formations
          </span>
        </div>
      </div>

      <section className="admin-shell">
        <h3 className="admin-doc-title">Ajouter un document</h3>
        <form className="contact-form" onSubmit={handleUpload}>
          <div className="form-grid">
            <label>
              Intitulé
              <input className="ui-field" name="label" type="text" required placeholder="Le devis à signer" />
            </label>
            <label>
              Formation concernée
              <select className="ui-field" name="formationSlug" defaultValue="">
                <option value="">Toutes les formations</option>
                {formations.map((formation) => (
                  <option key={formation.slug} value={formation.slug}>
                    {formation.title.trim()}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Précision (facultatif)
            <input
              className="ui-field"
              name="description"
              type="text"
              placeholder="à signer et à nous renvoyer"
              maxLength={400}
            />
          </label>

          <label>
            Fichier
            <input
              accept=".pdf,.doc,.docx"
              className="ui-field"
              name="document"
              ref={fileRef}
              required
              type="file"
            />
            <small className="admin-field-hint">PDF, DOC ou DOCX, 10 Mo maximum.</small>
          </label>

          <Button disabled={uploading} type="submit" variant="primary">
            {uploading ? "Envoi..." : "Ajouter le document"}
          </Button>
        </form>
      </section>

      <section className="admin-shell">
        <h3 className="admin-doc-title">Documents communs à toutes les formations</h3>
        {communs.length ? (
          renderDocuments(communs)
        ) : (
          <p className="admin-empty">Aucun document commun pour le moment.</p>
        )}

        {specifiques.length ? (
          <>
            <h3 className="admin-doc-title">Documents propres à une formation</h3>
            {renderDocuments(specifiques)}
          </>
        ) : null}
      </section>

      <section className="admin-shell">
        <h3 className="admin-doc-title">Modèle de message</h3>

        <label>
          S&apos;applique à
          <select className="ui-field" onChange={(event) => setTemplateScope(event.target.value)} value={templateScope}>
            <option value="">Toutes les formations (modèle général)</option>
            {formations.map((formation) => (
              <option key={formation.slug} value={formation.slug}>
                {formation.title.trim()}
              </option>
            ))}
          </select>
          <small className="admin-field-hint">
            {templateScope
              ? "Ce texte remplace le modèle général pour cette formation uniquement."
              : "Ce texte sert à toutes les formations qui n'ont pas de modèle propre."}
          </small>
        </label>

        <label>
          Objet du message
          <input
            className="ui-field"
            onChange={(event) => setTemplate((current) => ({ ...current, subject: event.target.value }))}
            type="text"
            value={template.subject}
          />
        </label>

        <label>
          Corps du message
          <textarea
            className="ui-field admin-doc-body"
            onChange={(event) => setTemplate((current) => ({ ...current, body: event.target.value }))}
            ref={bodyRef}
            rows={16}
            value={template.body}
          />
        </label>

        <div className="admin-doc-variables">
          <span>Insérer :</span>
          {VARIABLES.map((variable) => (
            <button key={variable.cle} onClick={() => insertVariable(variable.cle)} title={variable.libelle} type="button">
              {variable.cle}
            </button>
          ))}
        </div>

        <Button disabled={saving} onClick={saveTemplate} variant="primary">
          {saving ? "Enregistrement..." : "Enregistrer le modèle"}
        </Button>
      </section>
    </div>
  );
}
