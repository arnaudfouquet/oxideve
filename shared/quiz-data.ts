import quizData from "./quiz-data.json";
import type { QuizDefinition } from "./types";

/**
 * Contenu repris des auto-évaluations existantes sur oxideve.com.
 * Les bonnes réponses n'étaient pas exposées côté client sur le site source ;
 * elles ont été déterminées ici à partir de la réglementation électrique/PV/PAC/IRVE
 * en vigueur (NF C 15-100, schémas de liaison à la terre, etc.) et doivent être
 * validées par un formateur avant mise en production.
 *
 * Les données vivent dans quiz-data.json (même pattern que shared/catalog-data.json)
 * afin que le backend (CommonJS/.js) puisse les charger avec un simple `require`,
 * tout en gardant ce module .ts comme point d'entrée typé côté frontend.
 */
export const quizzes: QuizDefinition[] = quizData as QuizDefinition[];

export function getQuizBySlug(slug: string): QuizDefinition | undefined {
  return quizzes.find((quiz) => quiz.slug === slug);
}

export function getQuizByFormationSlug(formationSlug: string): QuizDefinition | undefined {
  return quizzes.find((quiz) => quiz.formationSlug === formationSlug);
}
