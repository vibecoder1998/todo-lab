import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyTheme, resolveTheme, themeScript } from "./theme";

const KEY = "todo-lab.theme";
let items: Map<string, string>;
let root: { dataset: Record<string, string> };

function stubBrowser({ prefersDark, getItem }: { prefersDark: boolean; getItem?: (key: string) => string | null }) {
  vi.stubGlobal("localStorage", {
    getItem: getItem ?? ((key: string) => items.get(key) ?? null),
    setItem: (key: string, value: string) => items.set(key, value),
  });
  vi.stubGlobal("document", { documentElement: root });
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-color-scheme: dark)" && prefersDark,
  }));
}

const runThemeScript = () => new Function(themeScript)();

beforeEach(() => {
  items = new Map();
  root = { dataset: {} };
});

describe("resolveTheme", () => {
  it("U1 a stored dark choice beats an OS light preference", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("U2 a stored light choice beats an OS dark preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
  });

  it.each([
    ["nothing stored", null],
    ["an empty string", ""],
    ["an unknown value", "system"],
    ["a differently cased value", "Dark"],
  ])("U3 %s falls back to the OS preference in both directions", (_, stored) => {
    expect(resolveTheme(stored, true)).toBe("dark");
    expect(resolveTheme(stored, false)).toBe("light");
  });
});

describe("themeScript", () => {
  it("U4 sets data-theme from the OS when nothing is stored", () => {
    stubBrowser({ prefersDark: true });
    runThemeScript();
    expect(root.dataset.theme).toBe("dark");

    stubBrowser({ prefersDark: false });
    runThemeScript();
    expect(root.dataset.theme).toBe("light");
  });

  it("U5 sets data-theme from the stored choice over the OS", () => {
    items.set(KEY, "light");
    stubBrowser({ prefersDark: true });
    runThemeScript();
    expect(root.dataset.theme).toBe("light");
  });

  it("U6 falls back to the OS without throwing when storage is blocked", () => {
    stubBrowser({
      prefersDark: true,
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
    });
    expect(runThemeScript).not.toThrow();
    expect(root.dataset.theme).toBe("dark");
  });
});

describe("applyTheme", () => {
  it("U7 sets data-theme now and is read back on the next load, even against the OS", () => {
    stubBrowser({ prefersDark: false });
    applyTheme("dark");
    expect(root.dataset.theme).toBe("dark");

    root = { dataset: {} };
    stubBrowser({ prefersDark: false });
    runThemeScript();
    expect(root.dataset.theme).toBe("dark");
    expect(resolveTheme(localStorage.getItem(KEY), false)).toBe("dark");
  });
});
