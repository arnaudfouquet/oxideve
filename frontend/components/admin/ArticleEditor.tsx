"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Éditeur d'articles basé sur Quill, chargé depuis le projet (aucun CDN, aucune
 * clé d'API). Il ajoute aux outils standards quatre blocs de mise en page et un
 * bouton d'appel à l'action, pensés pour une rédactrice non technicienne : elle
 * ne voit jamais de HTML.
 */

type Props = {
  /** HTML brut stocké en base : c'est lui qu'on recharge, pas le rendu filtré. */
  value: string;
  onChange: (html: string) => void;
  onError: (message: string) => void;
};

/** Pages du site proposées dans le sélecteur de lien du bouton d'action. */
const SITE_PAGES = [
  { label: "Page contact", value: "/contact" },
  { label: "Catalogue des formations", value: "/formations" },
  { label: "Financement", value: "/financement" },
  { label: "Qui sommes-nous", value: "/qui-sommes-nous" },
  { label: "Actualités", value: "/actualites" },
  { label: "Bulletin d'inscription", value: "/bulletin-inscription" },
];

const IMAGE_WIDTHS = [25, 50, 75, 100];

type QuillInstance = {
  root: HTMLDivElement;
  on: (event: string, handler: () => void) => void;
  getSelection: (focus?: boolean) => { index: number; length: number } | null;
  insertEmbed: (index: number, type: string, value: unknown, source?: string) => void;
  setSelection: (index: number, length?: number) => void;
  clipboard: {
    convert: (input: { html: string }) => unknown;
    dangerouslyPasteHTML: {
      (html: string, source?: string): void;
      (index: number, html: string, source?: string): void;
    };
  };
  getLength: () => number;
  format: (name: string, value: unknown) => void;
  removeFormat: (index: number, length: number) => void;
};

export function ArticleEditor({ value, onChange, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const onChangeRef = useRef(onChange);
  const onErrorRef = useRef(onError);

  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Barre flottante : elle suit l'élément sélectionné (image ou bloc).
  const [floating, setFloating] = useState<{ top: number; left: number; kind: "image" | "block" } | null>(null);
  const selectedRef = useRef<HTMLElement | null>(null);

  onChangeRef.current = onChange;
  onErrorRef.current = onError;

  /** Envoie un fichier et renvoie son URL publique. */
  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/admin/uploads/article-image", { method: "POST", body: formData });
    const result = (await response.json().catch(() => null)) as { data?: { url: string }; error?: string } | null;

    setUploading(false);

    if (!response.ok || !result?.data?.url) {
      // Message précis : « l'envoi a échoué » n'aide personne.
      onErrorRef.current(result?.error || "L'image n'a pas pu être envoyée. Vérifiez le format et la taille (5 Mo).");
      return null;
    }

    return result.data.url;
  }

  /** Demande un ou plusieurs fichiers à l'utilisateur. */
  function pickFiles(multiple: boolean): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp";
      input.multiple = multiple;
      input.onchange = () => resolve(Array.from(input.files || []));
      input.click();
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      // Quill est servi depuis /vendor : pas de CDN, pas de dépendance externe.
      if (!(window as unknown as { Quill?: unknown }).Quill) {
        await new Promise<void>((resolve, reject) => {
          const style = document.createElement("link");
          style.rel = "stylesheet";
          style.href = "/vendor/quill/quill.snow.css";
          document.head.appendChild(style);

          const script = document.createElement("script");
          script.src = "/vendor/quill/quill.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Quill n'a pas pu être chargé."));
          document.body.appendChild(script);
        }).catch((error: Error) => {
          onErrorRef.current(error.message);
        });
      }

      if (cancelled || !containerRef.current) return;

      // Le chargement du script est asynchrone : deux montages rapproches
      // (React en mode strict, ou une reouverture du formulaire) pouvaient
      // tous deux arriver ici et instancier Quill deux fois, ce qui laissait
      // une barre d'outils en double au-dessus de l'editeur.
      if (quillRef.current) return;

      // Quill insere sa barre d'outils AVANT le conteneur, dans le parent.
      // React, qui ne connait que le conteneur, ne la supprime pas lors d'un
      // demontage : on nettoie donc les barres laissees par un montage
      // precedent avant d'en creer une nouvelle.
      containerRef.current.parentElement
        ?.querySelectorAll(":scope > .ql-toolbar")
        .forEach((element) => element.remove());

      const Quill = (window as unknown as { Quill: new (el: Element, options: unknown) => QuillInstance }).Quill;
      if (!Quill) return;

      const quill = new Quill(containerRef.current, {
        theme: "snow",
        placeholder: "Rédigez votre article...",
        modules: {
          toolbar: {
            container: [
              [{ header: [2, 3, false] }],
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["blockquote", "link", "image"],
              ["clean"],
            ],
            handlers: {
              async image() {
                const [file] = await pickFiles(false);
                if (!file) return;

                const url = await uploadImage(file);
                if (!url) return;

                const range = quillRef.current?.getSelection(true);
                const index = range ? range.index : quillRef.current?.getLength() ?? 0;
                // Jamais de base64 : une seule photo ferait exploser la page.
                quillRef.current?.insertEmbed(index, "image", url, "user");
                quillRef.current?.setSelection(index + 1);
              },
            },
          },
        },
      });

      quillRef.current = quill;

      // On recharge le HTML brut stocké, pas le rendu public filtré : sinon les
      // tailles d'images et les blocs seraient perdus à chaque édition.
      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value);
      }

      // Infobulles en français : Quill ne pose que des libellés anglais.
      const TOOLTIPS: Record<string, string> = {
        ".ql-bold": "Gras",
        ".ql-italic": "Italique",
        ".ql-underline": "Souligné",
        ".ql-list[value='ordered']": "Liste numérotée",
        ".ql-list[value='bullet']": "Liste à puces",
        ".ql-blockquote": "Citation",
        ".ql-link": "Insérer un lien",
        ".ql-image": "Insérer une image",
        ".ql-clean": "Effacer la mise en forme",
      };

      const toolbar = containerRef.current?.previousElementSibling;
      Object.entries(TOOLTIPS).forEach(([selector, label]) => {
        toolbar?.querySelector(selector)?.setAttribute("title", label);
      });

      quill.on("text-change", () => {
        onChangeRef.current(quill.root.innerHTML);
        // Le contenu a bougé : la barre flottante pointerait à côté.
        setFloating(null);
        selectedRef.current = null;
      });

      setReady(true);
    }

    boot();

    return () => {
      cancelled = true;

      // Meme nettoyage au demontage, pour ne rien laisser dans le DOM.
      containerRef.current?.parentElement
        ?.querySelectorAll(":scope > .ql-toolbar")
        .forEach((element) => element.remove());

      if (containerRef.current) containerRef.current.innerHTML = "";
      quillRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Place la barre flottante au-dessus de l'élément cliqué. */
  function showFloatingFor(element: HTMLElement, kind: "image" | "block") {
    const editor = containerRef.current;
    if (!editor) return;

    const box = element.getBoundingClientRect();
    const reference = editor.getBoundingClientRect();

    selectedRef.current = element;
    setFloating({ top: box.top - reference.top - 38, left: box.left - reference.left, kind });
  }

  // Clic sur une image ou un bloc : on ouvre la barre d'outils adaptée.
  useEffect(() => {
    if (!ready) return;

    const editor = containerRef.current;
    if (!editor) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;

      const block = target.closest<HTMLElement>("[data-layout]");
      if (block) {
        showFloatingFor(block, "block");
        return;
      }

      if (target.tagName === "IMG") {
        showFloatingFor(target, "image");
        return;
      }

      setFloating(null);
      selectedRef.current = null;
    }

    editor.addEventListener("click", handleClick);

    // Au défilement ou au redimensionnement, la barre resterait accrochée à un
    // emplacement obsolète.
    function hide() {
      setFloating(null);
      selectedRef.current = null;
    }

    window.addEventListener("resize", hide);
    editor.addEventListener("scroll", hide);

    return () => {
      editor.removeEventListener("click", handleClick);
      window.removeEventListener("resize", hide);
      editor.removeEventListener("scroll", hide);
    };
  }, [ready]);

  /** La largeur va dans l'attribut natif : un style en ligne serait filtré. */
  function resizeImage(percent: number) {
    const image = selectedRef.current;
    if (!image || image.tagName !== "IMG") return;

    image.setAttribute("width", String(percent));
    setFloating(null);

    if (quillRef.current) onChangeRef.current(quillRef.current.root.innerHTML);
  }

  function removeSelection() {
    const element = selectedRef.current;
    if (!element) return;

    element.remove();
    setFloating(null);
    selectedRef.current = null;

    if (quillRef.current) onChangeRef.current(quillRef.current.root.innerHTML);
  }

  /** Insère un fragment HTML à la position courante. */
  function insertHtml(html: string) {
    const quill = quillRef.current;
    if (!quill) return;

    const range = quill.getSelection(true);
    const index = range ? range.index : quill.getLength();

    quill.setSelection(index);
    quill.clipboard.dangerouslyPasteHTML(index, html, "user");
    onChangeRef.current(quill.root.innerHTML);
  }

  /** Galerie de 2, 3 ou 4 images. */
  async function insertGallery(count: number) {
    const files = await pickFiles(true);
    if (!files.length) return;

    const urls: string[] = [];
    for (const file of files.slice(0, count)) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }

    if (!urls.length) return;

    // Structure volontairement plate : aucun div imbriqué, ce qui rend le
    // filtre serveur beaucoup plus simple et plus sûr.
    const images = urls.map((url) => `<img src="${url}" alt="" />`).join("");
    insertHtml(`<div data-layout="galerie-${count}">${images}</div>`);
  }

  /** Bloc image + texte, avec le côté choisi par l'utilisateur. */
  async function insertImageText() {
    const side = window.prompt("Image à gauche ou à droite ? Tapez gauche ou droite", "gauche");
    if (!side) return;

    const normalized = side.trim().toLowerCase().startsWith("d") ? "droite" : "gauche";

    const [file] = await pickFiles(false);
    if (!file) return;

    const url = await uploadImage(file);
    if (!url) return;

    const heading = window.prompt("Titre du bloc (laissez vide si inutile)", "") || "";
    const text = window.prompt("Texte du bloc. Séparez les paragraphes par une ligne vide.", "") || "";

    const paragraphs = text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("");

    insertHtml(
      `<div data-layout="image-texte-${normalized}"><img src="${url}" alt="" />${
        heading ? `<h3>${heading}</h3>` : ""
      }${paragraphs}</div>`,
    );
  }

  /** Bouton d'appel à l'action : libellé + destination. */
  function insertCallToAction() {
    const label = window.prompt("Texte du bouton", "Demander un devis");
    if (!label) return;

    const suggestions = SITE_PAGES.map((page, index) => `${index + 1}. ${page.label} (${page.value})`).join("\n");
    const answer = window.prompt(
      `Destination du bouton.\nTapez un numéro :\n${suggestions}\n\nOu collez une adresse complète (https://...)`,
      "1",
    );
    if (!answer) return;

    const choice = Number.parseInt(answer.trim(), 10);
    const href =
      Number.isFinite(choice) && SITE_PAGES[choice - 1] ? SITE_PAGES[choice - 1].value : answer.trim();

    insertHtml(`<div data-layout="bouton"><a href="${href}">${label}</a></div>`);
  }

  return (
    <div className="article-editor">
      <div className="article-editor-blocks">
        <span className="article-editor-blocks-label">Blocs de mise en page</span>
        <button disabled={uploading} onClick={() => insertGallery(2)} type="button">
          2 images
        </button>
        <button disabled={uploading} onClick={() => insertGallery(3)} type="button">
          3 images
        </button>
        <button disabled={uploading} onClick={() => insertGallery(4)} type="button">
          4 images
        </button>
        <button disabled={uploading} onClick={insertImageText} type="button">
          Image + texte
        </button>
        <button disabled={uploading} onClick={insertCallToAction} type="button">
          Bouton d&apos;action
        </button>
        {uploading ? <span className="article-editor-status">Envoi de l&apos;image...</span> : null}
      </div>

      <div className="article-editor-surface">
        <div ref={containerRef} />

        {floating ? (
          <div className="article-editor-floating" style={{ top: floating.top, left: floating.left }}>
            {floating.kind === "image" ? (
              <>
                {IMAGE_WIDTHS.map((percent) => (
                  <button key={percent} onClick={() => resizeImage(percent)} type="button">
                    {percent} %
                  </button>
                ))}
                <button className="is-danger" onClick={removeSelection} type="button">
                  Supprimer
                </button>
              </>
            ) : (
              <button className="is-danger" onClick={removeSelection} type="button">
                Supprimer le bloc
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
