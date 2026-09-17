import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion admin",
  description: "Connexion à l'espace d'administration Oxideve.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AdminLoginForm nextPath={next || "/admin"} />;
}
