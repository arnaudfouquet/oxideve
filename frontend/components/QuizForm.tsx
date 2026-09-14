"use client";

import { FormEvent, useEffect, useState } from "react";

type PublicQuizOption = {
  label: string;
};

type PublicQuizQuestion = {
  id: string;
  domain: string;
  question: string;
  options: PublicQuizOption[];
};

type PublicQuiz = {
  slug: string;
  formationSlug: string;
  title: string;
  selfRatingDomains: { id: string; label: string }[];
  questions: PublicQuizQuestion[];
};

type QuizAttemptDetail = {
  questionId: string;
  domain: string;
  question: string;
  submittedLabel: string | null;
  correctLabel: string | null;
  isCorrect: boolean;
};

type QuizAttemptResult = {
  scoreOn20: number;
  correctCount: number;
  totalQuestions: number;
  details: QuizAttemptDetail[];
};

const SELF_RATING_LEVELS = ["Jamais vu", "Vu les bases", "Utilisé parfois", "Maîtrisé"];

type Props = {
  quizSlug: string;
  bulletinInscriptionId?: string;
};

export function QuizForm({ quizSlug, bulletinInscriptionId = "" }: Props) {
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<QuizAttemptResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadQuiz() {
      const response = await fetch(`/api/quiz-by-slug/${quizSlug}`);

      if (!response.ok) {
        if (!cancelled) {
          setLoadError("Cette auto-évaluation est introuvable.");
        }
        return;
      }

      const data = (await response.json()) as { data: PublicQuiz };

      if (!cancelled) {
        setQuiz(data.data);
      }
    }

    loadQuiz().catch(() => {
      if (!cancelled) {
        setLoadError("Impossible de charger l'auto-évaluation pour le moment.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [quizSlug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!quiz) {
      return;
    }

    setStatus("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const learnerFullName = String(formData.get("learnerFullName") || "");
    const learnerEmail = String(formData.get("learnerEmail") || "");
    const companyName = String(formData.get("companyName") || "");

    const answers: Record<string, string> = {};
    for (const question of quiz.questions) {
      const value = formData.get(`question-${question.id}`);
      if (typeof value === "string") {
        answers[question.id] = value;
      }
    }

    const selfRatings: Record<string, string> = {};
    for (const domain of quiz.selfRatingDomains) {
      const value = formData.get(`self-rating-${domain.id}`);
      if (typeof value === "string") {
        selfRatings[domain.id] = value;
      }
    }

    const payload = {
      bulletinInscriptionId,
      quizSlug: quiz.slug,
      learnerFullName,
      learnerEmail,
      companyName,
      answers,
      selfRatings,
    };

    const response = await fetch("/api/quiz-attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(data?.error || "Impossible d'envoyer votre auto-évaluation pour le moment.");
      return;
    }

    const data = (await response.json()) as { data: QuizAttemptResult };
    setResult(data.data);
    setStatus("success");
  }

  if (loadError) {
    return <p className="form-status error">{loadError}</p>;
  }

  if (!quiz) {
    return <p>Chargement de l&apos;auto-évaluation...</p>;
  }

  if (status === "success" && result) {
    const scoreRatio = Math.max(0, Math.min(1, result.scoreOn20 / 20));

    return (
      <div className="quiz-result">
        <div className="quiz-score-card">
          <div
            className="quiz-score-ring"
            style={{ "--quiz-score-ratio": scoreRatio } as React.CSSProperties}
          >
            <span className="quiz-score-value">{result.scoreOn20}</span>
            <span className="quiz-score-max">/ 20</span>
          </div>
          <div>
            <h2 className="bulletin-form-block-title">
              <span>✓</span> Auto-évaluation complétée
            </h2>
            <p>
              {result.correctCount} bonne(s) réponse(s) sur {result.totalQuestions} question(s).
            </p>
          </div>
        </div>
        <div className="quiz-result-list">
          {result.details.map((detail) => (
            <div key={detail.questionId} className={`quiz-result-item ${detail.isCorrect ? "is-correct" : "is-incorrect"}`}>
              <p className="quiz-result-question">{detail.question}</p>
              <p>
                Votre réponse : <strong>{detail.submittedLabel || "Non répondu"}</strong>
              </p>
              {!detail.isCorrect ? (
                <p>
                  Bonne réponse : <strong>{detail.correctLabel}</strong>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalSteps = quiz.questions.length;

  return (
    <form className="contact-form quiz-form" onSubmit={handleSubmit}>
      <section className="bulletin-form-block">
        <h2 className="bulletin-form-block-title">
          <span>1</span> Qui êtes-vous ?
        </h2>
        <div className="form-grid">
          <label>
            Prénom et nom
            <input className="ui-field" name="learnerFullName" type="text" required placeholder="Prénom Nom" />
          </label>
          <label>
            Email
            <input className="ui-field" name="learnerEmail" type="email" required placeholder="vous@entreprise.fr" />
          </label>
          <label>
            Entreprise
            <input className="ui-field" name="companyName" type="text" placeholder="Nom de l'entreprise" />
          </label>
        </div>
      </section>

      <section className="bulletin-form-block">
        <h2 className="bulletin-form-block-title">
          <span>2</span> Situez vos connaissances
        </h2>
        <div className="quiz-self-rating-grid">
          {quiz.selfRatingDomains.map((domain) => (
            <fieldset className="quiz-self-rating-item" key={domain.id}>
              <legend>{domain.label}</legend>
              <div className="quiz-self-rating-options">
                {SELF_RATING_LEVELS.map((level) => (
                  <label className="quiz-radio-option" key={level}>
                    <input name={`self-rating-${domain.id}`} type="radio" value={level} />
                    {level}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="bulletin-form-block">
        <h2 className="bulletin-form-block-title">
          <span>3</span> Testez vos connaissances
        </h2>
        <div className="quiz-question-list">
          {quiz.questions.map((question, index) => (
            <fieldset className="quiz-question" key={question.id}>
              <legend>
                <span className="quiz-question-number">{index + 1}/{totalSteps}</span> {question.domain}
              </legend>
              <div className="quiz-question-body">
                <p className="quiz-question-text">{question.question}</p>
                <div className="quiz-question-options">
                  {question.options.map((option) => (
                    <label className="quiz-radio-option" key={option.label}>
                      <input name={`question-${question.id}`} type="radio" value={option.label} required />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <button className="ui-button ui-button-primary" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Envoi..." : "Valider mon auto-évaluation"}
      </button>
      {message && status === "error" ? <p className="form-status error">{message}</p> : null}
    </form>
  );
}
