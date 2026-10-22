"use client";

import { FormEvent, useRef, useState } from "react";

type Props = {
  pages: string[];
  kinds: string[];
  /** Appele apres un envoi reussi, pour rafraichir la liste affichee dessous. */
  onSent?: () => void;
};

export function FeedbackForm({ pages, kinds, onSent }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  // Horodatage attendu par honeypotGuard : un envoi trop rapide apres
  // l'affichage est considere comme automatise et rejete.
  const [formRenderedAt] = useState(() => Date.now());
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * La capture part avant le formulaire : on stocke son URL, que l'envoi
   * final transmet. Le visiteur voit donc tout de suite si elle est passée.
   */
  async function uploadImage(file: File, name: string) {
    setUploading(true);
    setMessage("");

    const body = new FormData();
    body.append("image", file);

    const response = await fetch("/api/retours/image", { method: "POST", body });
    const data = (await response.json().catch(() => null)) as { data?: { url: string }; error?: string } | null;

    setUploading(false);

    if (!response.ok || !data?.data) {
      setStatus("error");
      setMessage(data?.error || "La capture n'a pas pu être envoyée.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setImageUrl(data.data.url);
    setImageName(name);
    setStatus("idle");
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadImage(file, file.name);
  }

  /**
   * Coller une capture (Impr. écran puis Ctrl+V) evite de l'enregistrer puis
   * de la rechercher. Le presse-papier fournit un fichier sans nom utile, on
   * en forge donc un lisible.
   */
  function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
    const item = Array.from(event.clipboardData.items).find((entry) => entry.type.startsWith("image/"));
    if (!item) return;

    const file = item.getAsFile();
    if (!file) return;

    event.preventDefault();

    const extension = (file.type.split("/")[1] || "png").replace("jpeg", "jpg");
    uploadImage(file, `capture-collée.${extension}`);
  }

  function removeImage() {
    setImageUrl("");
    setImageName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    const response = await fetch("/api/retours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, imageUrl }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(data?.error || "Votre retour n'a pas pu être envoyé.");
      return;
    }

    form.reset();
    removeImage();
    setStatus("success");
    setMessage("Merci, votre retour a bien été envoyé. Vous pouvez en ajouter un autre.");
    onSent?.();
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="form-honeypot" />
      <input name="formRenderedAt" type="hidden" value={formRenderedAt} readOnly />

      <div className="form-grid">
        <label>
          Page concernée
          <select className="ui-field" name="page" required defaultValue="">
            <option disabled value="">
              Choisir la page
            </option>
            {pages.map((page) => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type de retour
          <select className="ui-field" name="kind" defaultValue={kinds[0]}>
            {kinds.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Votre prénom
        <input className="ui-field" name="author" type="text" required placeholder="Sophie" maxLength={120} />
      </label>

      <label>
        Votre remarque
        <textarea
          className="ui-field contact-form-textarea"
          name="message"
          onPaste={handlePaste}
          rows={5}
          required
          minLength={5}
          maxLength={2000}
          placeholder="Décrivez ce que vous avez vu, et ce que vous attendiez. Exemple : le bouton « Je m'inscris » ne réagit pas sur mon téléphone."
        />
      </label>

      {/* onPaste ici ET sur le champ de message : c'est la que le curseur se
          trouve quand la testeuse vient de faire sa capture. */}
      <div className="feedback-upload" onPaste={handlePaste}>
        <span className="feedback-upload-label">Capture d&apos;écran (facultatif)</span>
        <p className="feedback-upload-paste">
          Faites votre capture, puis collez-la ici avec <kbd>Ctrl</kbd> + <kbd>V</kbd> — inutile de
          l&apos;enregistrer d&apos;abord. Vous pouvez aussi choisir un fichier.
        </p>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="feedback-upload-input"
          onChange={handleFileChange}
          ref={fileRef}
          type="file"
        />
        {uploading ? <span className="feedback-upload-status">Envoi de la capture...</span> : null}
        {imageUrl ? (
          <span className="feedback-upload-done">
            {imageName} ajoutée
            <button onClick={removeImage} type="button">
              retirer
            </button>
          </span>
        ) : null}
        <small className="feedback-upload-hint">JPG, PNG ou WEBP, 5 Mo maximum.</small>
      </div>

      <button className="ui-button ui-button-primary home-cta-arrow" type="submit" disabled={status === "loading" || uploading}>
        {status === "loading" ? "Envoi..." : "Envoyer mon retour"}
      </button>

      {message ? <p className={`form-status ${status}`}>{message}</p> : null}
    </form>
  );
}
