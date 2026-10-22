"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { FEEDBACK_STATUSES } from "@/lib/feedback-options";
import { formatShortDateTimeFr } from "@/components/admin/formatters";

type Feedback = {
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
function statusTone(status: string) {
  if (status === "Corrigé") return "done";
  if (status === "En cours") return "doing";
  if (status === "Non retenu") return "dropped";
  return "todo";
}

/**
 * Ecran « Retours » : les remarques deposees par les testeuses depuis la page
 * /retours, avec leur capture et leur avancement.
 */
export function FeedbackPanel({
  onError,
  onFeedback,
}: {
  onError: (message: string) => void;
  onFeedback: (message: string) => void;
}) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("À traiter");
  const [preview, setPreview] = useState("");

  async function reload() {
    const response = await fetch("/api/admin/retours");

    if (!response.ok) {
      onError("Les retours n'ont pas pu être chargés.");
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as { data: Feedback[] };
    setFeedbacks(payload.data);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibles = useMemo(
    () => (filter === "Tous" ? feedbacks : feedbacks.filter((item) => item.status === filter)),
    [feedbacks, filter],
  );

  const compteurs = useMemo(() => {
    const total: Record<string, number> = {};
    for (const item of feedbacks) total[item.status] = (total[item.status] || 0) + 1;
    return total;
  }, [feedbacks]);

  async function changeStatus(id: string, status: string) {
    const response = await fetch(`/api/admin/retours/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      onError("Le statut n'a pas pu être enregistré.");
      return;
    }

    setFeedbacks((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    onFeedback("Statut mis à jour");
  }

  async function remove(id: string, author: string) {
    if (!window.confirm(`Supprimer définitivement le retour de ${author} ?`)) return;

    const response = await fetch(`/api/admin/retours/${id}`, { method: "DELETE" });

    if (!response.ok) {
      onError("Le retour n'a pas pu être supprimé.");
      return;
    }

    setFeedbacks((current) => current.filter((item) => item.id !== id));
    onFeedback("Retour supprimé");
  }

  if (loading) {
    return <p className="admin-empty">Chargement des retours...</p>;
  }

  const aTraiter = compteurs["À traiter"] || 0;

  return (
    <div className="admin-editorial">
      <div className="admin-editorial-head">
        <div>
          <h2>Retours des testeuses</h2>
          <span>
            {feedbacks.length} retour{feedbacks.length > 1 ? "s" : ""}
            {aTraiter ? ` · ${aTraiter} à traiter` : ""} · lien à partager : /retours
          </span>
        </div>
      </div>

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
        <p className="admin-empty">
          {feedbacks.length === 0
            ? "Aucun retour pour le moment. Partagez le lien /retours aux testeuses."
            : "Aucun retour avec ce statut."}
        </p>
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
                <label>
                  Statut
                  <select
                    className="ui-field"
                    onChange={(event) => changeStatus(item.id, event.target.value)}
                    value={item.status}
                  >
                    {FEEDBACK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="admin-copy-button admin-copy-button-danger"
                  onClick={() => remove(item.id, item.author)}
                  type="button"
                >
                  Supprimer
                </button>
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
    </div>
  );
}
