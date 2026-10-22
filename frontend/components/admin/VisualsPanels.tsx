"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { getCategoryTheme, type CategoryVisual } from "@/lib/formation-theme";
import type { FormationDraft } from "@/components/admin/types";
import type { Formation } from "../../../shared/types";
/** "50% 30%" -> [50, 30], avec repli sur le centre si la valeur est vide. */
function parsePosition(value: string | undefined): [number, number] {
  const parts = (value || "50% 50%").split(/\s+/);
  const x = Number.parseInt(parts[0], 10);
  const y = Number.parseInt(parts[1] ?? parts[0], 10);

  return [Number.isFinite(x) ? x : 50, Number.isFinite(y) ? y : 50];
}

/**
 * Aperçu d'un format (bannière ou tuile) avec ses deux curseurs de cadrage.
 * `shape` ne change que les proportions de l'aperçu, pour coller au rendu réel.
 */
function BannerCropPreview({
  image,
  label,
  hint,
  shape,
  value,
  onChange,
  onReset,
}: {
  image: string;
  label: string;
  hint: string;
  shape: "banner" | "tile";
  value: string;
  onChange: (next: string) => void;
  onReset: () => void;
}) {
  const [x, y] = parsePosition(value);

  return (
    <div className="admin-crop">
      <div className="admin-crop-head">
        <strong>{label}</strong>
        {value ? (
          <button className="admin-banner-reset" type="button" onClick={onReset}>
            Cadrage par défaut
          </button>
        ) : null}
      </div>
      <p className="admin-field-hint">{hint}</p>

      <div className={`admin-crop-preview admin-crop-preview-${shape}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={`Aperçu : ${label}`} src={image} style={{ objectPosition: `${x}% ${y}%` }} />
      </div>

      <div className="admin-banner-sliders">
        <label>
          <span>Horizontal : {x}%</span>
          <input type="range" min={0} max={100} value={x} onChange={(event) => onChange(`${event.target.value}% ${y}%`)} />
        </label>
        <label>
          <span>Vertical : {y}%</span>
          <input type="range" min={0} max={100} value={y} onChange={(event) => onChange(`${x}% ${event.target.value}%`)} />
        </label>
      </div>
    </div>
  );
}

/**
 * Photo de la formation : envoi direct d'un fichier ou saisie d'un chemin, puis
 * réglage séparé du cadrage pour la bannière de la page formation et pour la
 * tuile du catalogue, les deux formats n'ayant pas les mêmes proportions.
 */
export function FormationBannerField({
  draft,
  onChange,
  onError,
}: {
  draft: FormationDraft;
  onChange: (updater: (current: FormationDraft) => FormationDraft) => void;
  onError: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [visuals, setVisuals] = useState<Record<string, CategoryVisual>>({});

  // Les visuels de catégorie sont réglés dans l'onglet Visuels : on les relit
  // ici pour que l'aperçu de la fiche montre exactement ce que verra le public.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/category-visuals")
      .then((response) => response.json())
      .then((result) => {
        if (cancelled) return;
        const index: Record<string, CategoryVisual> = {};
        ((result?.data || []) as CategoryVisual[]).forEach((visual) => {
          index[`${visual.scope}:${visual.name}`] = visual;
        });
        setVisuals(index);
      })
      .catch(() => {
        /* on retombe sur les visuels par défaut */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const theme = getCategoryTheme(
    draft.category,
    draft.subCategory,
    {
      bannerImage: draft.bannerImage,
      bannerPosition: draft.bannerPosition,
      tilePosition: draft.tilePosition,
    },
    visuals,
  );

  // Vrai tant qu'aucune photo propre n'est définie : on affiche alors celle
  // héritée de la sous-catégorie ou de la catégorie.
  const isInherited = !draft.bannerImage.trim();

  async function handleUpload(file: File | undefined) {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/admin/uploads/formation-image", { method: "POST", body: formData });
    const result = (await response.json().catch(() => null)) as { data?: { url: string }; error?: string } | null;

    setUploading(false);

    if (!response.ok || !result?.data?.url) {
      onError(result?.error || "L'image n'a pas pu être envoyée.");
      return;
    }

    onChange((current) => ({ ...current, bannerImage: result.data!.url }));
  }

  // Par défaut on montre simplement les deux visuels hérités : le réglage par
  // catégorie se fait dans l'onglet Visuels. L'utilisateur n'ouvre les réglages
  // que s'il veut vraiment une photo propre à cette formation.
  if (isInherited) {
    return (
      <div className="admin-banner-field">
        <div className="admin-banner-head">
          <strong>Photo de la formation</strong>
          <span className="admin-banner-tag">Reprise de la catégorie</span>
        </div>

        <div className="admin-crop-grid">
          <figure className="admin-crop">
            <figcaption className="admin-crop-head">
              <strong>Bannière de la fiche</strong>
            </figcaption>
            <div className="admin-crop-preview admin-crop-preview-banner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Bannière héritée" src={theme.banner} style={{ objectPosition: theme.bannerPosition }} />
            </div>
          </figure>
          <figure className="admin-crop">
            <figcaption className="admin-crop-head">
              <strong>Tuile du catalogue</strong>
            </figcaption>
            <div className="admin-crop-preview admin-crop-preview-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Tuile héritée" src={theme.banner} style={{ objectPosition: theme.tilePosition }} />
            </div>
          </figure>
        </div>

        <p className="admin-field-hint">
          Ces visuels viennent de la catégorie et se modifient dans l&apos;onglet <strong>Visuels</strong>, pour toutes
          les formations concernées à la fois.
        </p>

        <label className="admin-upload-button">
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(event) => {
              handleUpload(event.target.files?.[0]);
              event.target.value = "";
            }}
            type="file"
          />
          <span>{uploading ? "Envoi en cours..." : "Vous souhaitez une image spécifique pour cette formation ?"}</span>
        </label>
      </div>
    );
  }

  return (
    <div className="admin-banner-field">
      <div className="admin-banner-head">
        <strong>Photo propre à cette formation</strong>
      </div>

      <div className="admin-banner-actions">
        <label className="admin-upload-button">
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(event) => {
              handleUpload(event.target.files?.[0]);
              event.target.value = "";
            }}
            type="file"
          />
          <span>{uploading ? "Envoi en cours..." : "Remplacer l'image"}</span>
        </label>

        <button
          className="admin-banner-reset"
          type="button"
          onClick={() =>
            onChange((current) => ({ ...current, bannerImage: "", bannerPosition: "", tilePosition: "" }))
          }
        >
          Revenir à la photo de la catégorie
        </button>
      </div>

      <p className="admin-field-hint">JPG, PNG ou WEBP, 5 Mo maximum. Réglez ensuite le cadrage pour chaque format.</p>

      <div className="admin-crop-grid">
        <BannerCropPreview
          image={theme.banner}
          label="Bannière de la fiche"
          hint="Bandeau large en haut de la page formation."
          shape="banner"
          value={theme.bannerPosition || ""}
          onChange={(next) => onChange((current) => ({ ...current, bannerPosition: next }))}
          onReset={() => onChange((current) => ({ ...current, bannerPosition: "" }))}
        />
        <BannerCropPreview
          image={theme.banner}
          label="Tuile du catalogue"
          hint="Vignette à droite de chaque résultat."
          shape="tile"
          value={theme.tilePosition || ""}
          onChange={(next) => onChange((current) => ({ ...current, tilePosition: next }))}
          onReset={() => onChange((current) => ({ ...current, tilePosition: "" }))}
        />
      </div>
    </div>
  );
}


/**
 * Écran « Visuels » : photo et cadrages par catégorie et par sous-catégorie.
 * Une formation peut toujours surcharger ces valeurs dans sa propre fiche.
 */
export function CategoryVisualsPanel({
  formations,
  onError,
  onFeedback,
}: {
  formations: Formation[];
  onError: (message: string) => void;
  onFeedback: (message: string) => void;
}) {
  const [visuals, setVisuals] = useState<Record<string, CategoryVisual>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");

  // Les entrées à afficher sont déduites du catalogue : pas de liste figée.
  const entries = useMemo(() => {
    const categories = new Set<string>();
    const subCategories = new Map<string, string>();

    formations.forEach((formation) => {
      if (formation.category) categories.add(formation.category);
      if (formation.subCategory) subCategories.set(formation.subCategory, formation.category);
    });

    const rows: { scope: "category" | "subCategory"; name: string; parent?: string; count: number }[] = [];

    Array.from(categories)
      .sort((left, right) => left.localeCompare(right, "fr"))
      .forEach((category) => {
        rows.push({
          scope: "category",
          name: category,
          count: formations.filter((f) => f.category === category).length,
        });

        Array.from(subCategories.entries())
          .filter(([, parent]) => parent === category)
          .sort((left, right) => left[0].localeCompare(right[0], "fr"))
          .forEach(([subCategory]) => {
            rows.push({
              scope: "subCategory",
              name: subCategory,
              parent: category,
              count: formations.filter((f) => f.subCategory === subCategory).length,
            });
          });
      });

    return rows;
  }, [formations]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/category-visuals")
      .then((response) => response.json())
      .then((result) => {
        if (cancelled) return;
        const list = (result?.data || []) as CategoryVisual[];
        const index: Record<string, CategoryVisual> = {};
        list.forEach((visual) => {
          index[`${visual.scope}:${visual.name}`] = visual;
        });
        setVisuals(index);
      })
      .catch(() => {
        if (!cancelled) onError("Les visuels n'ont pas pu être chargés.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(key: string, patch: Partial<CategoryVisual>) {
    setVisuals((current) => ({ ...current, [key]: { ...current[key], ...patch } as CategoryVisual }));
  }

  async function save(scope: "category" | "subCategory", name: string) {
    const key = `${scope}:${name}`;
    const visual = visuals[key] || {};

    setSavingKey(key);
    onFeedback("");

    const response = await fetch("/api/admin/category-visuals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope,
        name,
        image: visual.image || "",
        bannerPosition: visual.bannerPosition || "",
        tilePosition: visual.tilePosition || "",
      }),
    });

    setSavingKey("");

    if (!response.ok) {
      onError("Le visuel n'a pas pu être enregistré.");
      return;
    }

    onFeedback(`Visuel enregistré pour « ${name} ».`);
  }

  if (loading) {
    return (
      <section className="admin-shell">
        <p>Chargement des visuels...</p>
      </section>
    );
  }

  return (
    <section className="admin-shell">
      <div className="section-heading section-heading-tight">
        <div>
          <h2>Visuels</h2>
        </div>
      </div>
      <p className="admin-field-hint">
        Photo et cadrages appliqués à toutes les formations d&apos;une catégorie ou d&apos;une sous-catégorie. Une
        formation peut toujours définir sa propre photo depuis sa fiche.
      </p>

      <div className="admin-visual-list">
        {entries.map((entry) => {
          const key = `${entry.scope}:${entry.name}`;
          const visual = visuals[key] || { scope: entry.scope, name: entry.name };

          return (
            <CategoryVisualRow
              busy={savingKey === key}
              entry={entry}
              key={key}
              onChange={(patch) => update(key, patch)}
              onError={onError}
              onSave={() => save(entry.scope, entry.name)}
              visual={visual}
            />
          );
        })}
      </div>
    </section>
  );
}

/** Une ligne de l'écran Visuels : envoi d'image + deux cadrages. */
function CategoryVisualRow({
  entry,
  visual,
  busy,
  onChange,
  onSave,
  onError,
}: {
  entry: { scope: "category" | "subCategory"; name: string; parent?: string; count: number };
  visual: CategoryVisual;
  busy: boolean;
  onChange: (patch: Partial<CategoryVisual>) => void;
  onSave: () => void;
  onError: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  // Aperçu : la photo saisie ici, sinon celle héritée du thème.
  const theme = getCategoryTheme(
    entry.scope === "category" ? entry.name : entry.parent || "",
    entry.scope === "subCategory" ? entry.name : null,
  );
  const image = visual.image || theme.banner;

  async function handleUpload(file: File | undefined) {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/admin/uploads/formation-image", { method: "POST", body: formData });
    const result = (await response.json().catch(() => null)) as { data?: { url: string }; error?: string } | null;

    setUploading(false);

    if (!response.ok || !result?.data?.url) {
      onError(result?.error || "L'image n'a pas pu être envoyée.");
      return;
    }

    onChange({ image: result.data.url });
  }

  return (
    <article className={`admin-visual-row admin-visual-row-${entry.scope}`}>
      <div className="admin-visual-identity">
        <strong>{entry.name}</strong>
        <span className="admin-visual-meta">
          {entry.scope === "category" ? "Catégorie" : `Sous-catégorie de ${entry.parent}`} · {entry.count} formation
          {entry.count > 1 ? "s" : ""}
        </span>

        <label className="admin-upload-button">
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(event) => {
              handleUpload(event.target.files?.[0]);
              event.target.value = "";
            }}
            type="file"
          />
          <span>{uploading ? "Envoi..." : "Changer la photo"}</span>
        </label>

        {visual.image ? (
          <button className="admin-banner-reset" type="button" onClick={() => onChange({ image: "" })}>
            Photo par défaut
          </button>
        ) : null}
      </div>

      <div className="admin-crop-grid">
        <BannerCropPreview
          hint="Bandeau large en haut de la fiche."
          image={image}
          label="Bannière"
          onChange={(next) => onChange({ bannerPosition: next })}
          onReset={() => onChange({ bannerPosition: "" })}
          shape="banner"
          value={visual.bannerPosition || theme.bannerPosition || ""}
        />
        <BannerCropPreview
          hint="Vignette du catalogue."
          image={image}
          label="Tuile"
          onChange={(next) => onChange({ tilePosition: next })}
          onReset={() => onChange({ tilePosition: "" })}
          shape="tile"
          value={visual.tilePosition || theme.tilePosition || ""}
        />
      </div>

      <div className="admin-visual-actions">
        <Button disabled={busy} onClick={onSave} type="button">
          {busy ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </article>
  );
}
