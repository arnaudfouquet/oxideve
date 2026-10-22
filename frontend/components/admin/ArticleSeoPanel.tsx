"use client";

import type { ArticleDraft } from "@/components/admin/types";
/**
 * Panneau « Référencement Google » : titre et description, avec compteurs et
 * aperçu du résultat de recherche mis à jour pendant la frappe. Laissés vides,
 * le titre et l'accroche de l'article sont utilisés.
 */
export function ArticleSeoPanel({
  draft,
  onChange,
}: {
  draft: ArticleDraft;
  onChange: (updater: (current: ArticleDraft) => ArticleDraft) => void;
}) {
  const TITLE_LIMIT = 60;
  const DESCRIPTION_LIMIT = 160;

  // Ce que Google affichera réellement : la valeur saisie, ou le repli.
  const effectiveTitle = draft.seoTitle.trim() || draft.title.trim() || "Titre de l'article";
  const effectiveDescription =
    draft.seoDescription.trim() ||
    draft.excerpt.trim() ||
    draft.bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, DESCRIPTION_LIMIT) ||
    "Description de l'article.";

  const custom = Boolean(draft.seoTitle.trim() || draft.seoDescription.trim());

  return (
    <details className="admin-seo-panel">
      <summary>
        Référencement Google
        <span className={`admin-seo-tag${custom ? " is-custom" : ""}`}>
          {custom ? "personnalisé" : "valeurs automatiques"}
        </span>
      </summary>

      <div className="admin-seo-body">
        <label>
          <span>
            Titre pour Google
            <em className={draft.seoTitle.length > TITLE_LIMIT ? "is-over" : ""}>
              {draft.seoTitle.length} / {TITLE_LIMIT}
            </em>
          </span>
          <input
            className="ui-field"
            onChange={(event) => onChange((current) => ({ ...current, seoTitle: event.target.value }))}
            placeholder={draft.title || "Repris du titre de l'article"}
            value={draft.seoTitle}
          />
        </label>

        <label>
          <span>
            Description pour Google
            <em className={draft.seoDescription.length > DESCRIPTION_LIMIT ? "is-over" : ""}>
              {draft.seoDescription.length} / {DESCRIPTION_LIMIT}
            </em>
          </span>
          <textarea
            className="ui-field"
            onChange={(event) => onChange((current) => ({ ...current, seoDescription: event.target.value }))}
            placeholder="Reprise de l'accroche de l'article"
            rows={3}
            value={draft.seoDescription}
          />
        </label>

        <div className="admin-seo-preview">
          <span className="admin-seo-preview-label">Aperçu du résultat de recherche</span>
          <div className="admin-seo-preview-card">
            <span className="admin-seo-preview-url">oxideve.com › actualites › {draft.slug || "nouvel-article"}</span>
            <strong className="admin-seo-preview-title">{effectiveTitle}</strong>
            <span className="admin-seo-preview-description">{effectiveDescription}</span>
          </div>
        </div>
      </div>
    </details>
  );
}
