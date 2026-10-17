// Catalog/asset validation. These checks run against the typed catalog
// data (no network needed) plus an optional async pass that confirms
// files actually exist at their declared paths. See
// docs/asset-authoring-checklist.md for what still needs manual
// inspection in Blender/the browser — not everything here can be
// automated (clipping, weight painting quality, texture seams, etc.).

import type { CatalogItem } from "@/types/catalog";

export interface ValidationIssue {
  itemId: string;
  field: string;
  severity: "error" | "warning";
  message: string;
}

const GLB_EXTENSION = /\.glb$/i;
const THUMBNAIL_EXTENSIONS = /\.(webp|png|jpg|jpeg|svg)$/i;

/**
 * Synchronous structural checks against the catalog metadata itself —
 * runs in Node or the browser, no fetches. Catches the class of bug
 * that silently breaks the outfit builder (e.g. a "rigid" item with no
 * attachment point declared).
 */
export function validateCatalogItem(item: CatalogItem): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (field: string, severity: ValidationIssue["severity"], message: string) =>
    issues.push({ itemId: item.id, field, severity, message });

  if (!item.id || item.id.trim() === "") {
    push("id", "error", "Missing id.");
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(item.id)) {
    push("id", "warning", `Id "${item.id}" doesn't follow the kebab-case convention (e.g. "top-white-blouse").`);
  }

  if (!item.name?.trim()) push("name", "error", "Missing display name.");

  if (!item.thumbnailUrl) {
    push("thumbnailUrl", "error", "Missing thumbnail path.");
  } else if (!THUMBNAIL_EXTENSIONS.test(item.thumbnailUrl)) {
    push("thumbnailUrl", "warning", `Thumbnail "${item.thumbnailUrl}" has an unexpected extension (expected webp/png/jpg/svg).`);
  }

  if (item.assetType === "skinned" || item.assetType === "rigid") {
    if (!item.modelUrl) {
      push("modelUrl", "error", `assetType "${item.assetType}" requires a modelUrl.`);
    } else if (!GLB_EXTENSION.test(item.modelUrl)) {
      push("modelUrl", "error", `modelUrl "${item.modelUrl}" must be a .glb file.`);
    }
  }

  if (item.assetType === "image-only" && item.modelUrl) {
    push("modelUrl", "warning", `assetType is "image-only" but a modelUrl is set — it will be ignored. Remove it or change assetType.`);
  }

  if (item.assetType === "rigid" && !item.attachmentPoint) {
    push("attachmentPoint", "error", "Rigid assets must declare an attachmentPoint (head, neck, left-hand, right-hand, waist, left-foot, right-foot, back).");
  }

  if (item.category !== "accessories" && item.attachmentPoint) {
    push("attachmentPoint", "warning", `attachmentPoint is set but category is "${item.category}", not "accessories" — confirm this is intentional.`);
  }

  if (item.colors.length === 0 && item.assetType !== "image-only") {
    push("colors", "warning", "No color variants defined — the item will render in its default material with no recolor option.");
  }

  for (const color of item.colors) {
    if (!color.swatch) push("colors", "error", `Color "${color.id}" is missing a swatch value.`);
    if (!color.materialColor && !color.textureUrl) {
      push("colors", "warning", `Color "${color.id}" has no materialColor or textureUrl — selecting it won't visibly change the 3D model.`);
    }
  }

  if (item.layering.replaces?.includes(item.category)) {
    push("layering.replaces", "error", "An item cannot replace its own category.");
  }
  if (item.layering.conflictsWith?.includes(item.category)) {
    push("layering.conflictsWith", "error", "An item cannot conflict with its own category.");
  }

  return issues;
}

export function validateCatalog(items: CatalogItem[]): ValidationIssue[] {
  const issues = items.flatMap(validateCatalogItem);

  const seenIds = new Set<string>();
  for (const item of items) {
    if (seenIds.has(item.id)) {
      issues.push({ itemId: item.id, field: "id", severity: "error", message: `Duplicate id "${item.id}" — ids must be unique across the whole catalog.` });
    }
    seenIds.add(item.id);
  }

  return issues;
}

/**
 * Confirms declared asset files actually exist, by issuing HEAD
 * requests. Browser-only (uses fetch against /public paths) — run this
 * from a dev-only diagnostics view, not on every page load.
 */
export async function validateAssetsExist(items: CatalogItem[]): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const checks: Promise<void>[] = [];

  function checkPath(itemId: string, field: string, path: string) {
    checks.push(
      fetch(path, { method: "HEAD" })
        .then((res) => {
          if (!res.ok) {
            issues.push({ itemId, field, severity: "error", message: `File not found at "${path}" (HTTP ${res.status}).` });
          }
        })
        .catch(() => {
          issues.push({ itemId, field, severity: "error", message: `Could not check "${path}" — network error.` });
        })
    );
  }

  for (const item of items) {
    if (item.thumbnailUrl) checkPath(item.id, "thumbnailUrl", item.thumbnailUrl);
    if (item.modelUrl) checkPath(item.id, "modelUrl", item.modelUrl);
  }

  await Promise.all(checks);
  return issues;
}

export function summarizeIssues(issues: ValidationIssue[]) {
  return {
    errorCount: issues.filter((i) => i.severity === "error").length,
    warningCount: issues.filter((i) => i.severity === "warning").length,
    isValid: issues.every((i) => i.severity !== "error"),
  };
}
