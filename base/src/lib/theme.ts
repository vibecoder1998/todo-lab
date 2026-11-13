export type Theme = "light" | "dark";

const STORAGE_KEY = "todo-lab.theme";

// Runs inside themeScript via toString(), so it must not reference anything outside itself.
export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}

// Inlined in <head> so data-theme is set before first paint. Blocked storage falls back to the OS.
export const themeScript = `(function () {
  var stored = null;
  try { stored = localStorage.getItem(${JSON.stringify(STORAGE_KEY)}); } catch (e) {}
  document.documentElement.dataset.theme = (${resolveTheme.toString()})(stored, matchMedia("(prefers-color-scheme: dark)").matches);
})();`;
