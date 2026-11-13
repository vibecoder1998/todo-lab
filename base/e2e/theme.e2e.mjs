import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT_DIR = process.env.OUT_DIR ?? join(import.meta.dirname, "results");
const VIEWPORT = { width: 1440, height: 1000 };
const ORIGIN = new URL(BASE_URL).origin;
const THEME_KEY = "todo-lab.theme";
const LIGHT_PAGE = [245, 248, 255];
const AA = 4.5;
const ADD_DIALOG = `dialog[aria-labelledby="add-task-title"]`;

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const isDark = (rgb) => contrast(rgb, [255, 255, 255]) > contrast(rgb, [0, 0, 0]);
const hex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

function assert(ok, message) {
  if (!ok) throw new Error(message);
}

async function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), "todo-lab-e2e-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    "about:blank",
  ]);
  const wsUrl = await new Promise((resolve, reject) => {
    let log = "";
    const timer = setTimeout(() => reject(new Error(`Chrome did not start:\n${log}`)), 15_000);
    chrome.stderr.on("data", (chunk) => {
      log += chunk;
      const match = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    chrome.on("error", reject);
  });
  const http = `http://${new URL(wsUrl).host}`;
  return {
    http,
    async close() {
      const exited = new Promise((resolve) => chrome.once("exit", resolve));
      chrome.kill();
      await exited;
      rmSync(profile, { recursive: true, force: true });
    },
  };
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error(`cannot connect to ${wsUrl}`));
  });
  let nextId = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id === undefined) return listeners.forEach((listener) => listener(message));
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  };
  return {
    send(method, params = {}) {
      const id = ++nextId;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    once(method) {
      return new Promise((resolve) => {
        const listener = (message) => {
          if (message.method !== method) return;
          listeners.delete(listener);
          resolve(message.params);
        };
        listeners.add(listener);
      });
    },
    close: () => ws.close(),
  };
}

async function openPage(browser, { prefersDark, stored, beforeLoad }) {
  const target = await (await fetch(`${browser.http}/json/new?about:blank`, { method: "PUT" })).json();
  const cdp = await connect(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Storage.clearDataForOrigin", { origin: ORIGIN, storageTypes: "local_storage" });
  await cdp.send("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: prefersDark ? "dark" : "light" }],
  });
  if (beforeLoad) await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: beforeLoad });

  const page = {
    async evaluate(expression) {
      const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (exceptionDetails) throw new Error(`page error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
      return result.value;
    },
    async waitFor(expression, timeoutMs = 30_000) {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        const value = await page.evaluate(expression).catch(() => undefined);
        if (value) return value;
        if (Date.now() > deadline) throw new Error(`timed out waiting for ${expression}`);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    },
    async load(action) {
      const loaded = cdp.once("Page.loadEventFired");
      await action();
      await loaded;
      await page.waitFor(`!!document.querySelector('button[aria-label="Dark mode"]')`);
    },
    goto: () => page.load(() => cdp.send("Page.navigate", { url: BASE_URL })),
    reload: () => page.load(() => cdp.send("Page.reload")),
    async click(selector) {
      const box = await page.evaluate(
        `(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`,
      );
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...box });
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...box });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...box });
    },
    theme: () => page.evaluate("document.documentElement.dataset.theme ?? null"),
    pressed: () => page.evaluate(`document.querySelector('button[aria-label="Dark mode"]').getAttribute("aria-pressed")`),
    bodyBackground: async () => (await page.colors("body")).bg,
    async colors(selector) {
      return page.evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error("missing element " + ${JSON.stringify(selector)});
        const parse = (css) => {
          const m = css.match(/^rgba?\\(([^)]+)\\)$/);
          if (!m) throw new Error("unparsed colour " + css);
          const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).map(Number);
          return [r, g, b, a];
        };
        const layers = [];
        for (let n = el; n; n = n.parentElement) {
          const c = parse(getComputedStyle(n).backgroundColor);
          if (c[3] > 0) layers.push(c);
          if (c[3] === 1) break;
        }
        let bg = [255, 255, 255];
        for (const [r, g, b, a] of layers.reverse()) bg = [r, g, b].map((v, i) => v * a + bg[i] * (1 - a));
        return { fg: parse(getComputedStyle(el).color).slice(0, 3), bg };
      })()`);
    },
    async screenshot(name) {
      await page.evaluate(`Promise.race([
        Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.complete || new Promise((r) => (img.onload = img.onerror = r)))]),
        new Promise((r) => setTimeout(r, 5000)),
      ])`);
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(OUT_DIR, name), Buffer.from(data, "base64"));
    },
    async close() {
      cdp.close();
      await fetch(`${browser.http}/json/close/${target.id}`);
    },
  };
  await page.goto();
  if (stored !== undefined) {
    await page.evaluate(`localStorage.setItem(${JSON.stringify(THEME_KEY)}, ${JSON.stringify(stored)})`);
    await page.reload();
  }
  return page;
}

async function contrastTargets(page) {
  const labels = await page.evaluate(`(() => {
    const seen = new Set();
    return [...document.querySelectorAll("article span[style]")].flatMap((span, i) => {
      const text = span.parentElement.textContent.trim();
      if (!/^(Status|Priority):/.test(text) || seen.has(text)) return [];
      seen.add(text);
      span.dataset.e2eLabel = String(i);
      return [{ name: text, selector: '[data-e2e-label="' + i + '"]' }];
    });
  })()`);
  return [
    { name: "task title", selector: "article h3" },
    { name: "task description", selector: "article h3 + p" },
    ...labels,
    { name: "header date", selector: "header p span:last-child" },
  ];
}

async function checkContrast(page) {
  const measured = [];
  for (const { name, selector } of await contrastTargets(page)) {
    const { fg, bg } = await page.colors(selector);
    measured.push({ name, ratio: contrast(fg, bg), fg: hex(fg), bg: hex(bg) });
  }
  const summary = measured.map((m) => `${m.name} ${m.ratio.toFixed(2)} (${m.fg} on ${m.bg})`).join("; ");
  const failing = measured.filter((m) => m.ratio < AA).map((m) => m.name);
  assert(measured.some((m) => m.name.startsWith("Status:")), `no status labels found to measure. ${summary}`);
  assert(failing.length === 0, `below ${AA}:1 for ${failing.join(", ")}. Measured: ${summary}`);
  return `all >= ${AA}:1. Measured: ${summary}`;
}

const cases = [
  {
    id: "E1",
    name: "OS light with nothing stored renders light",
    async run(browser) {
      const page = await openPage(browser, { prefersDark: false });
      const theme = await page.theme();
      const bg = await page.bodyBackground();
      await page.screenshot("light.png");
      await page.close();
      assert(theme === "light", `data-theme is ${theme}, expected light`);
      assert(hex(bg) === hex(LIGHT_PAGE), `body background ${hex(bg)}, expected the light page colour ${hex(LIGHT_PAGE)}`);
      return `data-theme=light, body ${hex(bg)}`;
    },
  },
  {
    id: "E2",
    name: "OS dark with nothing stored renders dark",
    async run(browser) {
      const page = await openPage(browser, { prefersDark: true });
      const theme = await page.theme();
      const bg = await page.bodyBackground();
      const pressed = await page.pressed();
      await page.screenshot("dark.png");
      await page.close();
      assert(theme === "dark", `data-theme is ${theme}, expected dark`);
      assert(isDark(bg), `body background ${hex(bg)} is not dark`);
      assert(pressed === "true", `Dark mode button aria-pressed=${pressed}, expected true`);
      return `data-theme=dark, body ${hex(bg)}, aria-pressed=true`;
    },
  },
  {
    id: "E3",
    name: "No flash: OS dark sets data-theme before the first animation frame",
    async run(browser) {
      const page = await openPage(browser, {
        prefersDark: true,
        beforeLoad: `requestAnimationFrame(() => { window.__firstFrameTheme = document.documentElement.dataset.theme ?? null; });`,
      });
      const firstFrame = await page.evaluate("window.__firstFrameTheme");
      await page.close();
      assert(firstFrame === "dark", `data-theme in the first frame was ${firstFrame}, expected dark`);
      return "data-theme=dark in the first requestAnimationFrame";
    },
  },
  {
    id: "E4",
    name: "Clicking Dark mode switches light to dark and survives a reload",
    async run(browser) {
      const page = await openPage(browser, { prefersDark: false });
      try {
        assert((await page.theme()) === "light", "starts light");
        assert((await page.pressed()) === "false", "Dark mode button starts with aria-pressed=false");
        await page.click('button[aria-label="Dark mode"]');
        await page.waitFor(`document.querySelector('button[aria-label="Dark mode"]').getAttribute("aria-pressed") === "true"`, 2000);
        const clicked = { theme: await page.theme(), bg: await page.bodyBackground() };
        assert(clicked.theme === "dark", `after click data-theme is ${clicked.theme}, expected dark`);
        assert(isDark(clicked.bg), `after click body background ${hex(clicked.bg)} is not dark`);
        await page.reload();
        const reloaded = { theme: await page.theme(), pressed: await page.pressed() };
        assert(reloaded.theme === "dark", `after reload data-theme is ${reloaded.theme}, expected dark`);
        assert(reloaded.pressed === "true", `after reload aria-pressed=${reloaded.pressed}, expected true`);
        return `click: dark, aria-pressed=true, body ${hex(clicked.bg)}. Reload: still dark, aria-pressed=true`;
      } finally {
        await page.close();
      }
    },
  },
  {
    id: "E5",
    name: "A stored light choice beats OS dark",
    async run(browser) {
      const page = await openPage(browser, { prefersDark: true, stored: "light" });
      const theme = await page.theme();
      const bg = await page.bodyBackground();
      await page.close();
      assert(theme === "light", `data-theme is ${theme}, expected light`);
      assert(hex(bg) === hex(LIGHT_PAGE), `body background ${hex(bg)}, expected ${hex(LIGHT_PAGE)}`);
      return `data-theme=light, body ${hex(bg)}`;
    },
  },
  {
    id: "E6",
    name: "In dark mode the Add task dialog opens with a dark surface",
    async run(browser) {
      const page = await openPage(browser, { prefersDark: true });
      try {
        await page.evaluate(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Add task").click()`);
        await page.waitFor(`document.querySelector(${JSON.stringify(ADD_DIALOG)})?.open`, 2000);
        const surface = (await page.colors(ADD_DIALOG)).bg;
        const heading = await page.colors(`${ADD_DIALOG} h2`);
        const field = await page.colors(`${ADD_DIALOG} input`);
        await page.screenshot("dark-dialog.png");
        const headingRatio = contrast(heading.fg, heading.bg);
        const fieldRatio = contrast(field.fg, field.bg);
        assert(isDark(surface), `dialog surface ${hex(surface)} is not dark`);
        assert(headingRatio >= AA, `dialog heading contrast ${headingRatio.toFixed(2)} < ${AA}`);
        assert(fieldRatio >= AA, `dialog input contrast ${fieldRatio.toFixed(2)} < ${AA}`);
        return `surface ${hex(surface)}, heading ${headingRatio.toFixed(2)}:1, input ${hex(field.fg)} on ${hex(field.bg)} ${fieldRatio.toFixed(2)}:1`;
      } finally {
        await page.close();
      }
    },
  },
  {
    id: "E7-light",
    name: "Light theme text contrast reaches WCAG AA 4.5:1",
    async run(browser) {
      const page = await openPage(browser, { prefersDark: false });
      try {
        assert((await page.theme()) === "light", "page is in light theme");
        return await checkContrast(page);
      } finally {
        await page.close();
      }
    },
  },
  {
    id: "E7-dark",
    name: "Dark theme text contrast reaches WCAG AA 4.5:1",
    async run(browser) {
      const page = await openPage(browser, { prefersDark: true });
      try {
        assert((await page.theme()) === "dark", "page is in dark theme");
        return await checkContrast(page);
      } finally {
        await page.close();
      }
    },
  },
];

mkdirSync(OUT_DIR, { recursive: true });
const startedAt = new Date().toISOString();
const results = [];
const browser = await launchChrome();
try {
  for (const testCase of cases) {
    const started = performance.now();
    let status = "passed";
    let detail;
    let timer;
    try {
      detail = await Promise.race([
        testCase.run(browser),
        new Promise((_, reject) => (timer = setTimeout(() => reject(new Error("case timed out after 60s")), 60_000))),
      ]);
    } catch (error) {
      status = "failed";
      detail = error.message;
    } finally {
      clearTimeout(timer);
    }
    const durationMs = Math.round(performance.now() - started);
    results.push({ id: testCase.id, name: testCase.name, status, detail, durationMs });
    console.log(`${status === "passed" ? "PASS" : "FAIL"} ${testCase.id} ${testCase.name} (${durationMs}ms): ${detail}`);
  }
} finally {
  await browser.close();
}

writeFileSync(join(OUT_DIR, "results.json"), JSON.stringify({ suite: "e2e", startedAt, results }, null, 2) + "\n");
const failed = results.filter((r) => r.status === "failed").length;
console.log(`${results.length - failed} passed, ${failed} failed. Results in ${join(OUT_DIR, "results.json")}`);
process.exitCode = failed ? 1 : 0;
