import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { QuizForm } from "@/components/QuizForm";
import { getQuizBySlug } from "../../../../shared/quiz-data";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ quizSlug: string }>;
  searchParams?: Promise<{ bulletinInscriptionId?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { quizSlug } = await params;
  const quiz = getQuizBySlug(quizSlug);

  return {
    title: quiz ? quiz.title : "Auto-évaluation",
    description: "Auto-évaluation à réaliser avant votre formation Oxideve.",
  };
}

export default async function AutoEvaluationPage({ params, searchParams }: Props) {
  const { quizSlug } = await params;
  const query = searchParams ? await searchParams : {};
  const quiz = getQuizBySlug(quizSlug);

  if (!quiz) {
    notFound();
  }

  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">Auto-évaluation</span>
          <h1>{quiz.title}</h1>
          <p>
            Cette auto-évaluation vous permet de situer votre niveau de connaissances avant la formation. Elle n&apos;est pas
            notée pour votre dossier : elle sert uniquement à adapter l&apos;accompagnement pédagogique.
          </p>
        </div>

        <article className="contact-card contact-card-standalone">
          <QuizForm quizSlug={quizSlug} bulletinInscriptionId={query?.bulletinInscriptionId || ""} />
        </article>
      </div>
    </section>
  );
}
