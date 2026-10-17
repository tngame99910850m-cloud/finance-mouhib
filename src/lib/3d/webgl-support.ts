export function detectWebGLSupport(): boolean {
  if (typeof window === "undefined") return true; // assume yes on server; client re-checks on mount
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}
