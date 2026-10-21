"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import type { Review } from "../../../shared/types";

/** Formulaire vierge, ou pré-rempli avec l'avis en cours d'édition. */
function toReviewDraft(review?: Review) {
  return {
    id: review?.id || "",
    author: review?.author || "",
    rating: review?.rating ?? 5,
    quote: review?.quote || "",
    source: review?.source || "Google",
    city: review?.city || "",
    period: review?.period || "",
    published: review?.published !== false,
    position: review?.position ?? 0,
  };
}

/**
 * Écran « Avis » : ajouter, modifier, supprimer les témoignages affichés dans
 * le carrousel de la page d'accueil.
 */
export function ReviewsPanel({
  onError,
  onFeedback,
}: {
  onError: (message: string) => void;
  onFeedback: (message: string) => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [draft, setDraft] = useState(toReviewDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const response = await fetch("/api/admin/reviews");
    const result = (await response.json().catch(() => null)) as { data?: Review[] } | null;
    if (result?.data) setReviews(result.data);
  }

  useEffect(() => {
    reload()
      .catch(() => onError("Les avis n'ont pas pu être chargés."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    onFeedback("");

    const editing = Boolean(draft.id);
    const response = await fetch(editing ? `/api/admin/reviews/${draft.id}` : "/api/admin/reviews", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: draft.author.trim(),
        rating: draft.rating,
        quote: draft.quote.trim(),
        source: draft.source.trim(),
        city: draft.city.trim(),
        period: draft.period.trim(),
        published: draft.published,
        position: draft.position,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      onError(result?.error || "L'avis n'a pas pu être enregistré.");
      return;
    }

    await reload();
    setDraft(toReviewDraft());
    onFeedback(editing ? "Avis mis à jour." : "Avis ajouté.");
  }

  async function handleDelete(review: Review) {
    if (!window.confirm(`Supprimer définitivement l'avis de ${review.author} ?`)) return;

    const response = await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" });

    if (!response.ok) {
      onError("L'avis n'a pas pu être supprimé.");
      return;
    }

    await reload();
    if (draft.id === review.id) setDraft(toReviewDraft());
    onFeedback("Avis supprimé.");
  }

  if (loading) {
    return (
      <section className="admin-shell">
        <p>Chargement des avis...</p>
      </section>
    );
  }

  return (
    <div className="admin-editorial">
      <div className="admin-editorial-head">
        <div>
          <h2>Avis clients</h2>
          <span>
            {reviews.length} avis · {reviews.filter((review) => review.published !== false).length} affiché
            {reviews.filter((review) => review.published !== false).length > 1 ? "s" : ""} sur le site
          </span>
        </div>
        {draft.id ? (
          <div className="admin-editorial-head-actions">
            <Button onClick={() => setDraft(toReviewDraft())} variant="secondary">
              Nouvel avis
            </Button>
          </div>
        ) : null}
      </div>

      <section className="admin-shell">
        <span className="admin-editorial-form-title">{draft.id ? "Modifier l'avis" : "Nouvel avis"}</span>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>Auteur</span>
              <input
                className="ui-field"
                onChange={(event) => setDraft((current) => ({ ...current, author: event.target.value }))}
                placeholder="Prénom Nom"
                required
                value={draft.author}
              />
            </label>
            <label>
              <span>Note</span>
              <select
                className="ui-field"
                onChange={(event) => setDraft((current) => ({ ...current, rating: Number(event.target.value) }))}
                value={draft.rating}
              >
                {[5, 4, 3, 2, 1].map((note) => (
                  <option key={note} value={note}>
                    {note} étoile{note > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Agence</span>
              <select
                className="ui-field"
                onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))}
                value={draft.city}
              >
                <option value="">Non précisée</option>
                <option value="Montpellier">Montpellier</option>
                <option value="Toulouse">Toulouse</option>
              </select>
            </label>
            <label>
              <span>Période</span>
              <input
                className="ui-field"
                onChange={(event) => setDraft((current) => ({ ...current, period: event.target.value }))}
                placeholder="septembre 2026"
                value={draft.period}
              />
            </label>
          </div>

          <label>
            <span>Avis</span>
            <textarea
              className="ui-field"
              onChange={(event) => setDraft((current) => ({ ...current, quote: event.target.value }))}
              required
              rows={4}
              value={draft.quote}
            />
          </label>

          <label className="contact-form-full admin-checkbox-item admin-checkbox-boxed">
            <input
              checked={draft.published}
              onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))}
              type="checkbox"
            />
            <span>
              Afficher sur le site
              <small className="admin-field-hint">Décoché, l&apos;avis est conservé mais retiré du carrousel.</small>
            </span>
          </label>

          <div className="admin-article-actions">
            <Button disabled={saving} type="submit">
              {saving ? "Enregistrement..." : draft.id ? "Mettre à jour" : "Ajouter l'avis"}
            </Button>
            {draft.id ? (
              <Button onClick={() => setDraft(toReviewDraft())} type="button" variant="secondary">
                Annuler
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="admin-shell">
        <div className="admin-editorial-list-head">
          <h3>Tous les avis</h3>
        </div>

        <table className="admin-editorial-table">
          <thead>
            <tr>
              <th>Auteur</th>
              <th>Note</th>
              <th>Avis</th>
              <th>Agence</th>
              <th>Affiché</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr className={draft.id === review.id ? "is-active" : ""} key={review.id}>
                <td>
                  <strong>{review.author}</strong>
                  <span className="admin-editorial-slug">{review.period || "—"}</span>
                </td>
                <td>
                  <span className="admin-review-stars">{"★".repeat(review.rating)}</span>
                </td>
                <td className="admin-review-quote">{review.quote}</td>
                <td>{review.city || "—"}</td>
                <td>
                  <span className={review.published === false ? "admin-editorial-draft" : ""}>
                    {review.published === false ? "Masqué" : "Oui"}
                  </span>
                </td>
                <td>
                  <div className="admin-editorial-row-actions">
                    <button className="admin-copy-button" onClick={() => setDraft(toReviewDraft(review))} type="button">
                      Modifier
                    </button>
                    <button
                      className="admin-copy-button admin-copy-button-danger"
                      onClick={() => handleDelete(review)}
                      type="button"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
