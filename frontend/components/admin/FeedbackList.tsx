"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { FEEDBACK_STATUSES } from "@/lib/feedback-options";
import { formatShortDateTimeFr } from "@/components/admin/formatters";

export type Feedback = {
  id: string;
  page: string;
  kind: string;
  author: string;
  message: string;
  imageUrl: string;
  status: string;
  createdAt: string;
};

/** Un statut par couleur, pour reperer d'un coup d'oeil ce qui reste a faire. */
export function statusTone(status: string) {
  if (status === "Corrigé") return "done";
  if (status === "En cours") return "doing";
  if (status === "Non retenu") return "dropped";
  return "todo";
}

type Props = {
  feedbacks: Feedback[];
  /** Filtre actif au premier affichage. */
  defaultFilter?: string;
  /** Sans ces deux fonctions, la liste est en lecture seule (page publique). */
  onStatusChange?: (id: string, status: string) => void;
  onDelete?: (id: string, author: string) => void;
  emptyLabel?: string;
};

/**
 * Liste des retours, partagee entre l'ecran d'administration et la page
 * publique /retours : meme presentation des deux cotes, seules les actions
 * de modification distinguent les deux usages.
 */
export function FeedbackList({
  feedbacks,
  defaultFilter = "Tous",
  onStatusChange,
  onDelete,
  emptyLabel = "Aucun retour pour le moment.",
}: Props) {
  const [filter, setFilter] = useState(defaultFilter);
  const [preview, setPreview] = useState("");

  const compteurs = useMemo(() => {
    const total: Record<string, number> = {};
    for (const item of feedbacks) total[item.status] = (total[item.status] || 0) + 1;
    return total;
  }, [feedbacks]);

  const visibles = useMemo(
    () => (filter === "Tous" ? feedbacks : feedbacks.filter((item) => item.status === filter)),
    [feedbacks, filter],
  );

  return (
    <>
      <div className="admin-feedback-filters">
        {["Tous", ...FEEDBACK_STATUSES].map((status) => (
          <button
            className={`admin-feedback-filter${filter === status ? " is-active" : ""}`}
            key={status}
            onClick={() => setFilter(status)}
            type="button"
          >
            {status}
            <span>{status === "Tous" ? feedbacks.length : compteurs[status] || 0}</span>
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="admin-empty">{feedbacks.length === 0 ? emptyLabel : "Aucun retour avec ce statut."}</p>
      ) : (
        <div className="admin-feedback-list">
          {visibles.map((item) => (
            <article className={`admin-feedback admin-feedback-${statusTone(item.status)}`} key={item.id}>
              <header className="admin-feedback-head">
                <span className="admin-feedback-page">{item.page}</span>
                <span className="admin-feedback-kind">{item.kind}</span>
                <span className="admin-feedback-date">{formatShortDateTimeFr(item.createdAt)}</span>
              </header>

              <p className="admin-feedback-author">{item.author}</p>
              <p className="admin-feedback-message">{item.message}</p>

              {item.imageUrl ? (
                <button className="admin-feedback-thumb" onClick={() => setPreview(item.imageUrl)} type="button">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Capture envoyée par la testeuse" src={item.imageUrl} />
                </button>
              ) : null}

              <footer className="admin-feedback-foot">
                {onStatusChange ? (
                  <label>
                    Statut
                    <select
                      className="ui-field"
                      onChange={(event) => onStatusChange(item.id, event.target.value)}
                      value={item.status}
                    >
                      {FEEDBACK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <span className={`admin-feedback-status admin-feedback-status-${statusTone(item.status)}`}>
                    {item.status}
                  </span>
                )}

                {onDelete ? (
                  <button
                    className="admin-copy-button admin-copy-button-danger"
                    onClick={() => onDelete(item.id, item.author)}
                    type="button"
                  >
                    Supprimer
                  </button>
                ) : null}
              </footer>
            </article>
          ))}
        </div>
      )}

      {preview ? (
        <div className="admin-feedback-preview" onClick={() => setPreview("")} role="presentation">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Capture en grand" src={preview} />
          <Button onClick={() => setPreview("")} variant="secondary">
            Fermer
          </Button>
        </div>
      ) : null}
    </>
  );
}
