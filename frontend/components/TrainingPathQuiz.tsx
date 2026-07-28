"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Formation } from "../../shared/types";

type Props = {
  formations: Formation[];
};

const questions = [
  {
    id: "domain",
    title: "Quel domaine correspond le mieux à votre besoin ?",
    answers: [
      { label: "Sécurité au travail, CACES ou habilitations", scores: { "Sécurité au travail": 3 } },
      { label: "Bureautique ou outils numériques", scores: { Bureautique: 3 } },
      { label: "Management ou organisation d'équipe", scores: { Management: 3 } },
      { label: "Énergies renouvelables (solaire, PAC, IRVE)", scores: { Photovoltaïque: 2, "Pompes à chaleur": 2, "Bornes de recharge": 1 } },
    ],
  },
  {
    id: "goal",
    title: "Quel est le besoin principal ?",
    answers: [
      { label: "Obtenir ou renouveler une habilitation obligatoire", scores: { "Sécurité au travail": 3 } },
      { label: "Gagner en efficacité sur un logiciel ou un outil", scores: { Bureautique: 3 } },
      { label: "Renforcer le pilotage ou la cohésion d'équipe", scores: { Management: 3 } },
      { label: "Obtenir ou renforcer une qualification chantier", scores: { Photovoltaïque: 2, "Pompes à chaleur": 2 } },
    ],
  },
  {
    id: "experience",
    title: "Votre niveau actuel sur ce sujet ?",
    answers: [
      { label: "Je découvre ce sujet", scores: { Bureautique: 1, "Sécurité au travail": 1, Management: 1 } },
      { label: "Je pratique déjà mais je veux sécuriser mes acquis", scores: { Photovoltaïque: 2, "Pompes à chaleur": 2, "Sécurité au travail": 1 } },
      { label: "Je gère surtout la préparation et l'organisation", scores: { Bureautique: 1, Management: 1 } },
      { label: "Je pilote une équipe et je veux la faire monter en compétence", scores: { Management: 2, "Sécurité au travail": 1 } },
    ],
  },
  {
    id: "format",
    title: "Quel format vous ferait gagner du temps ?",
    answers: [
      { label: "Un parcours qualification complet", scores: { Photovoltaïque: 2, "Pompes à chaleur": 2 } },
      { label: "Un module court d'introduction ou de prise en main", scores: { Bureautique: 2, "Bornes de recharge": 1 } },
      { label: "Une remise à niveau sécurité ou habilitation", scores: { "Sécurité au travail": 2 } },
      { label: "Une formation encadrement ou gestion d'équipe", scores: { Management: 2 } },
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