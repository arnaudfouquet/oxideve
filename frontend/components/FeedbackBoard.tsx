"use client";

import { useCallback, useEffect, useState } from "react";
import { FeedbackForm } from "@/components/FeedbackForm";
import { FeedbackList, type Feedback } from "@/components/admin/FeedbackList";

type Props = {
  pages: string[];
  kinds: string[];
};

/**
 * Page /retours : le formulaire, puis la liste de ce qui a deja ete signale.
 * Les deux sont lies, la liste se recharge des qu'un retour est envoye.
 */
export function FeedbackBoard({ kinds, pages }: Props) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const response = await fetch("/api/retours");

    if (!response.ok) {
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as { data: Feedback[] };
    setFeedbacks(payload.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <>
      <div className="ct-form-card">
        <h2 className="ct-card-title">
          Décrivez <em>ce que vous avez vu</em>
        </h2>
        <FeedbackForm kinds={kinds} onSent={reload} pages={pages} />
      </div>

      <section className="feedback-board">
        <div className="feedback-board-head">
          <h2>
            Retours déjà <em>signalés</em>
          </h2>
          <span>
            {loading
              ? "Chargement..."
              : `${feedbacks.length} retour${feedbacks.length > 1 ? "s" : ""} · inutile de signaler deux fois la même chose`}
          </span>
        </div>

        {loading ? null : (
          <FeedbackList
            emptyLabel="Rien n'a encore été signalé. Votre retour sera le premier."
            feedbacks={feedbacks}
          />
        )}
      </section>
    </>
  );
}
