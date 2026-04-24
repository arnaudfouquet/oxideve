"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Formation } from "../../shared/types";

type Props = {
  formations: Formation[];
};

const questions = [
  {
    id: "market",
    title: "Quel chantier revient le plus souvent ?",
    answers: [
      { label: "Installation photovoltaïque en toiture", scores: { Photovoltaïque: 3 } },
      { label: "PAC air / eau ou climatisation", scores: { "Pompes à chaleur": 3, "Traitement d'air": 2 } },
      { label: "Bornes de recharge et IRVE", scores: { "Bornes de recharge": 3 } },
      { label: "Sécurité et habilitations équipe", scores: { "Sécurité au travail": 3 } },
    ],
  },
  {
    id: "goal",
    title: "Quel est le besoin principal ?",
    answers: [
      { label: "Obtenir ou renforcer une qualification chantier", scores: { Photovoltaïque: 2, "Pompes à chaleur": 2 } },
      { label: "Mise en service et diagnostic", scores: { "Pompes à chaleur": 2, "Traitement d'air": 2 } },
      { label: "Vendre et cadrer l'offre", scores: { Photovoltaïque: 2 } },
      { label: "Mettre une équipe en conformité", scores: { "Sécurité au travail": 2 } },
    ],
  },
  {
    id: "experience",
    title: "Votre niveau actuel sur ce sujet ?",
    answers: [
      { label: "Je démarre sur cette famille", scores: { Photovoltaïque: 1, "Pompes à chaleur": 1, "Traitement d'air": 1 } },
      { label: "Je pose déjà mais je veux sécuriser mes pratiques", scores: { Photovoltaïque: 2, "Pompes à chaleur": 2 } },
      { label: "Je gère surtout la préparation et l'avant-vente", scores: { Photovoltaïque: 1, Bureautique: 1 } },
      { label: "Je pilote une équipe et son organisation", scores: { "Sécurité au travail": 1, Bureautique: 1 } },
    ],
  },
  {
    id: "format",
    title: "Quel format te ferait gagner du temps ?",
    answers: [
      { label: "Un parcours qualification complet", scores: { Photovoltaïque: 2, "Pompes à chaleur": 2 } },
      { label: "Un module court d'introduction ou de prise en main", scores: { "Pompes à chaleur": 1, "Traitement d'air": 2 } },
      { label: "Une formation commerciale ou administrative", scores: { Photovoltaïque: 2, Bureautique: 2 } },
      { label: "Une remise à niveau sécurité", scores: { "Sécurité au travail": 2 } },
    ],
  },
];

export function TrainingPathQuiz({ formations }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const currentQuestion = questions[stepIndex];
  const isDone = stepIndex >= questions.length;

  const results = useMemo(() => {
    const totals = new Map<string, number>();

    for (const question of questions) {
      const answerIndex = answers[question.id];
      const answer = typeof answerIndex === "number" ? question.answers[answerIndex] : null;

      if (!answer) {
        continue;
      }

      for (const [category, score] of Object.entries(answer.scores)) {
        totals.set(category, (totals.get(category) || 0) + score);
      }
    }

    return [...totals.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 2)
      .map(([category]) => ({
        category,
        formations: formations.filter((formation) => formation.category === category).slice(0, 3),
      }));
  }, [answers, formations]);

  function selectAnswer(answerIndex: number) {
    setAnswers((current) => ({ ...current, [currentQuestion.id]: answerIndex }));
    setStepIndex((current) => current + 1);
  }

  function resetQuiz() {
    setAnswers({});
    setStepIndex(0);
  }

  if (isDone) {
    return (
      <div className="quiz-shell">
        <div className="quiz-step-meta">
          <span className="eyebrow">Résultat</span>
          <h2>Parcours conseillé</h2>
          <p>Voici les familles les plus cohérentes avec ton activité et ton besoin immédiat.</p>
        </div>

        <div className="quiz-results-grid">
          {results.map((result) => (
            <article className="quiz-result-card" key={result.category}>
              <strong>{result.category}</strong>
              <p>Oxideve peut te faire démarrer ou consolider cette spécialité avec des formats immédiatement exploitables.</p>
              <div className="quiz-result-links">
                {result.formations.map((formation) => (
                  <Link href={`/formations/${formation.slug}`} key={formation.slug}>{formation.title}</Link>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="quiz-actions-row">
          <button className="ui-button ui-button-secondary" onClick={resetQuiz} type="button">Recommencer</button>
          <Link className="ui-button ui-button-primary" href="/formations">Voir tout le catalogue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-shell">
      <div className="quiz-step-meta">
        <span className="eyebrow">Question {stepIndex + 1} / {questions.length}</span>
        <h2>{currentQuestion.title}</h2>
        <p>Réponds simplement selon tes chantiers et ton besoin actuel. Le diagnostic reste rapide et orienté métier.</p>
      </div>

      <div className="quiz-answer-grid">
        {currentQuestion.answers.map((answer, index) => (
          <button className="quiz-answer-card" key={answer.label} onClick={() => selectAnswer(index)} type="button">
            <strong>{answer.label}</strong>
            <span>Choisir cette réponse</span>
          </button>
        ))}
      </div>
    </div>
  );
}