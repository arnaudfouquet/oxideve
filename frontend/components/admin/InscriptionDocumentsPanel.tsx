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

type Preview = {
  formation: { slug: string; title: string };
  session: { city: string; startDate: string; endDate: string } | null;
  documents: Document[];
  subject: string;
  body: string;
  templateIsCustom: boolean;
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

type Onglet = "documents" | "message" | "apercu";

/**
 * Ecran « Dossiers » : documents joints, modele de message et apercu du
 * dossier tel que le prospect le recevra. Organise en onglets : la liste
 * seule devenait illisible des quelques dizaines de documents.
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
  const [onglet, setOnglet] = useState<Onglet>("documents");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [filtreFormation, setFiltreFormation] = useState("");

  // Edition en place : la ligne du document devient un formulaire.
  const [editingId, setEditingId] = useState("");
  const [editDraft, setEditDraft] = useState({ label: "", description: "", formationSlug: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const [templateScope, setTemplateScope] = useState("");
  const [template, setTemplate] = useState<Template>({ subject: "", body: "", formationSlug: "" });

  const [apercuSlug, setApercuSlug] = useState("");
  const [apercu, setApercu] = useState<Preview | null>(null);
  const [apercuLoading, setApercuLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const titreParSlug = useMemo(() => {
    const index: Record<string, string> = {};
    for (const formation of formations) index[formation.slug] = formation.title.trim();
    return index;
  }, [formations]);

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

  async function reloadApercu(slug: string) {
    if (!slug) {
      setApercu(null);
      return;
    }

    setApercuLoading(true);

    const response = await fetch(`/api/admin/inscription-preview?formationSlug=${encodeURIComponent(slug)}`);

    setApercuLoading(false);

    if (!response.ok) {
      onError("L'aperçu n'a pas pu être chargé.");
      return;
    }

    const payload = (await response.json()) as { data: Preview };
    setApercu(payload.data);
  }

  useEffect(() => {
    reloadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadTemplate(templateScope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateScope]);

  useEffect(() => {
    reloadApercu(apercuSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apercuSlug]);

  const communs = useMemo(() => documents.filter((item) => !item.formationSlug), [documents]);

  /** Documents propres a une formation, regroupes par formation. */
  const groupes = useMemo(() => {
    const index: Record<string, Document[]> = {};

    for (const document of documents) {
      if (!document.formationSlug) continue;
      if (!index[document.formationSlug]) index[document.formationSlug] = [];
      index[document.formationSlug].push(document);
    }

    return Object.entries(index).sort((left, right) =>
      (titreParSlug[left[0]] || left[0]).localeCompare(titreParSlug[right[0]] || right[0], "fr"),
    );
  }, [documents, titreParSlug]);

  /** Recherche et filtre appliques a une liste de documents. */
  function filtrer(liste: Document[]) {
    const terme = search.trim().toLowerCase();

    return liste.filter((document) => {
      if (filtreFormation === "communs" && document.formationSlug) return false;
      if (filtreFormation && filtreFormation !== "communs" && document.formationSlug !== filtreFormation) return false;
      if (!terme) return true;

      return (
        document.label.toLowerCase().includes(terme) ||
        document.description.toLowerCase().includes(terme) ||
        (titreParSlug[document.formationSlug] || "").toLowerCase().includes(terme)
      );
    });
  }

  const communsFiltres = filtrer(communs);
  const groupesFiltres = groupes
    .map(([slug, liste]) => [slug, filtrer(liste)] as [string, Document[]])
    .filter(([, liste]) => liste.length);

  const totalAffiche = communsFiltres.length + groupesFiltres.reduce((somme, [, liste]) => somme + liste.length, 0);

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
    setShowForm(false);
    await reloadDocuments();
    onFeedback("Document ajouté");
  }

  function startEdit(document: Document) {
    setEditingId(document.id);
    setEditDraft({
      label: document.label,
      description: document.description,
      formationSlug: document.formationSlug,
    });
  }

  async function saveEdit(id: string) {
    if (!editDraft.label.trim()) {
      onError("L'intitulé ne peut pas être vide.");
      return;
    }

    setSavingEdit(true);

    const response = await fetch(`/api/admin/inscription-documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: editDraft.label.trim(),
        description: editDraft.description.trim(),
        formationSlug: editDraft.formationSlug,
      }),
    });

    setSavingEdit(false);

    if (!response.ok) {
      onError("Le document n'a pas pu être modifié.");
      return;
    }

    const payload = (await response.json()) as { data: Document };

    setDocuments((current) => current.map((item) => (item.id === id ? payload.data : item)));
    setEditingId("");
    onFeedback("Document modifié");
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
      body: JSON.stringify({ formationSlug: templateScope, subject: template.subject, body: template.body }),
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

  function renderDocument(document: Document) {
    // En edition, la ligne devient un formulaire : seul le fichier n'est pas
    // modifiable, il faudrait en deposer un nouveau.
    if (editingId === document.id) {
      return (
        <li className="admin-doc is-editing" key={document.id}>
          <div className="admin-doc-edit">
            <div className="form-grid">
              <label>
                Intitulé
                <input
                  className="ui-field"
                  onChange={(event) => setEditDraft((current) => ({ ...current, label: event.target.value }))}
                  type="text"
                  value={editDraft.label}
                />
              </label>
              <label>
                Formation concernée
                <select
                  className="ui-field"
                  onChange={(event) => setEditDraft((current) => ({ ...current, formationSlug: event.target.value }))}
                  value={editDraft.formationSlug}
                >
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
              Précision
              <input
                className="ui-field"
                maxLength={400}
                onChange={(event) => setEditDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="à signer et à nous renvoyer"
                type="text"
                value={editDraft.description}
              />
            </label>

            <small className="admin-field-hint">
              Fichier : {document.fileName} · {formatSize(document.fileSize)} — pour le remplacer, déposez un nouveau
              document et supprimez celui-ci.
            </small>

            <div className="admin-doc-edit-actions">
              <Button disabled={savingEdit} onClick={() => saveEdit(document.id)} variant="primary">
                {savingEdit ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button onClick={() => setEditingId("")} variant="secondary">
                Annuler
              </Button>
            </div>
          </div>
        </li>
      );
    }

    return (
      <li className={`admin-doc${document.published ? "" : " is-hidden"}`} key={document.id}>
        <div className="admin-doc-main">
          <a href={document.fileUrl} target="_blank" rel="noreferrer">
            {document.label}
          </a>
          {document.description ? <span className="admin-doc-note">{document.description}</span> : null}
          <span className="admin-doc-meta">
            {document.fileName.split(".").pop()?.toUpperCase()}
            {document.fileSize ? ` · ${formatSize(document.fileSize)}` : ""}
            {document.published ? "" : " · masqué"}
          </span>
        </div>
        <div className="admin-doc-actions">
          <button className="admin-copy-button" onClick={() => startEdit(document)} type="button">
            Modifier
          </button>
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
            {communs.length > 1 ? "s" : ""} · {groupes.length} formation{groupes.length > 1 ? "s" : ""} avec des
            documents propres
          </span>
        </div>
      </div>

      <div className="admin-tabs">
        {(
          [
            ["documents", "Documents"],
            ["message", "Modèle de message"],
            ["apercu", "Aperçu du dossier"],
          ] as [Onglet, string][]
        ).map(([valeur, libelle]) => (
          <button
            className={`admin-tab${onglet === valeur ? " is-active" : ""}`}
            key={valeur}
            onClick={() => setOnglet(valeur)}
            type="button"
          >
            {libelle}
          </button>
        ))}
      </div>

      {onglet === "documents" ? (
        <section className="admin-shell">
          <div className="admin-doc-toolbar">
            <input
              className="ui-field"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un document..."
              type="search"
              value={search}
            />
            <select
              className="ui-field"
              onChange={(event) => setFiltreFormation(event.target.value)}
              value={filtreFormation}
            >
              <option value="">Tous les documents</option>
              <option value="communs">Communs à toutes les formations</option>
              {groupes.map(([slug]) => (
                <option key={slug} value={slug}>
                  {titreParSlug[slug] || slug}
                </option>
              ))}
            </select>
            <Button onClick={() => setShowForm((valeur) => !valeur)} variant={showForm ? "secondary" : "primary"}>
              {showForm ? "Annuler" : "Ajouter un document"}
            </Button>
          </div>

          {showForm ? (
            <form className="contact-form admin-doc-form" onSubmit={handleUpload}>
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
                <input accept=".pdf,.doc,.docx" className="ui-field" name="document" ref={fileRef} required type="file" />
                <small className="admin-field-hint">PDF, DOC ou DOCX, 10 Mo maximum.</small>
              </label>

              <Button disabled={uploading} type="submit" variant="primary">
                {uploading ? "Envoi..." : "Ajouter le document"}
              </Button>
            </form>
          ) : null}

          {search || filtreFormation ? (
            <p className="admin-doc-count">
              {totalAffiche} document{totalAffiche > 1 ? "s" : ""} affiché{totalAffiche > 1 ? "s" : ""}
            </p>
          ) : null}

          {communsFiltres.length ? (
            <details className="admin-doc-group" open>
              <summary>
                Communs à toutes les formations <span>{communsFiltres.length}</span>
              </summary>
              <ul className="admin-doc-list">{communsFiltres.map(renderDocument)}</ul>
            </details>
          ) : null}

          {groupesFiltres.map(([slug, liste]) => (
            <details className="admin-doc-group" key={slug}>
              <summary>
                {titreParSlug[slug] || slug} <span>{liste.length}</span>
              </summary>
              <ul className="admin-doc-list">{liste.map(renderDocument)}</ul>
            </details>
          ))}

          {!totalAffiche ? (
            <p className="admin-empty">
              {documents.length ? "Aucun document ne correspond à la recherche." : "Aucun document pour le moment."}
            </p>
          ) : null}
        </section>
      ) : null}

      {onglet === "message" ? (
        <section className="admin-shell">
          <label>
            S&apos;applique à
            <select
              className="ui-field"
              onChange={(event) => setTemplateScope(event.target.value)}
              value={templateScope}
            >
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
              <button
                key={variable.cle}
                onClick={() => insertVariable(variable.cle)}
                title={variable.libelle}
                type="button"
              >
                {variable.cle}
              </button>
            ))}
          </div>

          <Button disabled={saving} onClick={saveTemplate} variant="primary">
            {saving ? "Enregistrement..." : "Enregistrer le modèle"}
          </Button>
        </section>
      ) : null}

      {onglet === "apercu" ? (
        <section className="admin-shell">
          <label>
            Formation à prévisualiser
            <select className="ui-field" onChange={(event) => setApercuSlug(event.target.value)} value={apercuSlug}>
              <option value="">Choisir une formation</option>
              {formations.map((formation) => (
                <option key={formation.slug} value={formation.slug}>
                  {formation.title.trim()}
                </option>
              ))}
            </select>
            <small className="admin-field-hint">
              Montre le message et les documents que recevra un prospect inscrit à cette formation.
            </small>
          </label>

          {apercuLoading ? <p className="admin-empty">Chargement de l&apos;aperçu...</p> : null}

          {apercu && !apercuLoading ? (
            <div className="admin-preview">
              <div className="admin-preview-mail">
                <span className="admin-preview-tag">Message envoyé</span>
                <p className="admin-preview-subject">{apercu.subject}</p>
                <pre className="admin-preview-body">{apercu.body}</pre>
                {apercu.templateIsCustom ? (
                  <small className="admin-field-hint">Modèle propre à cette formation.</small>
                ) : (
                  <small className="admin-field-hint">Modèle général, commun à toutes les formations.</small>
                )}
              </div>

              <div className="admin-preview-folder">
                <span className="admin-preview-tag">Page du dossier</span>
                <p className="admin-preview-subject">{apercu.formation.title}</p>
                {apercu.session ? (
                  <p className="admin-doc-note">
                    {apercu.session.city} — à partir du{" "}
                    {new Date(apercu.session.startDate).toLocaleDateString("fr-FR")}
                  </p>
                ) : (
                  <p className="admin-doc-note">Aucune session programmée</p>
                )}

                <p className="admin-preview-step">1. Remplir le bulletin d&apos;inscription</p>
                <p className="admin-preview-step">
                  2. Consulter les documents <span>{apercu.documents.length}</span>
                </p>

                <ul className="admin-doc-list">
                  {apercu.documents.map((document) => (
                    <li className="admin-doc" key={document.id}>
                      <div className="admin-doc-main">
                        <a href={document.fileUrl} target="_blank" rel="noreferrer">
                          {document.label}
                        </a>
                        {document.description ? (
                          <span className="admin-doc-note">{document.description}</span>
                        ) : null}
                        <span className="admin-doc-meta">
                          {document.formationSlug ? "propre à cette formation" : "commun"}
                          {document.fileSize ? ` · ${formatSize(document.fileSize)}` : ""}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                {!apercu.documents.length ? (
                  <p className="admin-empty">Aucun document ne sera proposé pour cette formation.</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
