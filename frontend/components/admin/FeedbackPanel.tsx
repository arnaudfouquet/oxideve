"use client";

import { useEffect, useMemo, useState } from "react";
import { FeedbackList, type Feedback } from "@/components/admin/FeedbackList";

/**
 * Ecran « Retours » : les remarques deposees par les testeuses depuis la page
 * /retours, avec leur capture et leur avancement. La presentation est celle de
 * FeedbackList, partagee avec la page publique.
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

  const aTraiter = useMemo(
    () => feedbacks.filter((item) => item.status === "À traiter").length,
    [feedbacks],
  );

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

      <FeedbackList
        defaultFilter="À traiter"
        emptyLabel="Aucun retour pour le moment. Partagez le lien /retours aux testeuses."
        feedbacks={feedbacks}
        onDelete={remove}
        onStatusChange={changeStatus}
      />
    </div>
  );
}
