"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(data?.error || "Connexion impossible pour le moment.");
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <div className="admin-login-shell">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Oxideve</span>
        <h1>Connexion admin</h1>
        <p>Accédez à l&apos;espace d&apos;administration du centre de formation.</p>
        <label>
          Email
          <input className="ui-field" name="email" type="email" required autoFocus placeholder="prenom@oxideve.com" />
        </label>
        <label>
          Mot de passe
          <input className="ui-field" name="password" type="password" required placeholder="••••••••" />
        </label>
        <button className="ui-button ui-button-primary" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Connexion..." : "Se connecter"}
        </button>
        {message ? <p className="form-status error">{message}</p> : null}
      </form>
    </div>
  );
}
