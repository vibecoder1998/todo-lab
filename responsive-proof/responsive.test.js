// Usage: NODE_PATH=<playwright node_modules> node responsive.test.js [baseUrl]
// Writes results.json and one screenshot per case into shots/.
const { chromium } = require("playwright");
const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const BASE = process.argv[2] ?? "http://localhost:3000/";
const SHOTS = path.join(__dirname, process.env.SHOTS ?? "shots");
const PHONE = { width: 375, height: 812 };
const DESKTOP = { width: 1440, height: 900 };
const LONG_WORD = "Supercalifragilisticexpialidocious".repeat(4);

async function open(browser, viewport, { storage } = {}) {
  const context = await browser.newContext({ viewport, hasTouch: viewport.width < 1024, isMobile: viewport.width < 1024 });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date("2026-11-13T10:00:00"));
  if (storage !== undefined) await page.addInitScript((value) => localStorage.setItem("todo-lab.tasks", value), storage);
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.getByRole("region", { name: "Task Status" }).waitFor();
  return page;
}

const todo = (page) => page.getByRole("region", { name: "To-Do" });
const completed = (page) => page.getByRole("region", { name: "Completed Task" });
const titles = (region) => region.getByRole("heading", { level: 3 }).allInnerTexts();
const menuButton = (page) => page.getByRole("button", { name: "Open menu" });

async function noHorizontalOverflow(page) {
  const { scroll, width } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
  assert.ok(scroll <= width, `page is ${scroll}px wide in a ${width}px viewport`);
}

async function clippedControls(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("main h2, main h3, input, button, figure, article, nav a")]
      .filter((el) => el.offsetParent !== null)
      .filter((el) => {
        const b = el.getBoundingClientRect();
        return b.left < -1 || b.right > innerWidth + 1;
      })
      .map((el) => (el.getAttribute("aria-label") || el.textContent).trim().slice(0, 40)),
  );
}

async function reachable(page, locator, label) {
  await locator.scrollIntoViewIfNeeded();
  const hiddenScroll = await locator.evaluate((el) => {
    for (let node = el.parentElement; node && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node);
      if ((node.scrollTop && /hidden|clip/.test(style.overflowY)) || (node.scrollLeft && /hidden|clip/.test(style.overflowX)))
        return `<${node.tagName.toLowerCase()} class="${node.className.slice(0, 40)}">`;
    }
    return null;
  });
  assert.equal(hiddenScroll, null, `${label} is only reachable by scrolling ${hiddenScroll}, which a user cannot scroll`);
  const box = await locator.boundingBox();
  const vp = page.viewportSize();
  assert.ok(box, `${label} is not rendered`);
  assert.ok(box.x >= -1 && box.x + box.width <= vp.width + 1, `${label} spans x ${box.x}..${box.x + box.width} in ${vp.width}px`);
  assert.ok(box.y >= -1 && box.y < vp.height, `${label} cannot be scrolled into view (y=${box.y})`);
}

const CASES = [];
const test = (id, kind, viewport, name, fn, storage) => CASES.push({ id, kind, viewport, name, fn, storage });

for (const [w, h] of [[320, 568], [360, 740], [375, 812], [414, 896], [768, 1024], [1024, 768], [1280, 720], [1440, 900], [1920, 1080]]) {
  test(`H-LAYOUT-${w}`, "happy", { width: w, height: h }, `${w}x${h}: no horizontal scroll and no control cut off at the sides`, async (page) => {
    await noHorizontalOverflow(page);
    assert.deepEqual(await clippedControls(page), []);
  });
}

test("H-M1", "happy", PHONE, "Phone: To-Do, Task Status and Completed Task can all be scrolled into view", async (page) => {
  await reachable(page, todo(page), "To-Do section");
  await reachable(page, page.getByRole("region", { name: "Task Status" }), "Task Status section");
  await reachable(page, completed(page), "Completed Task section");
  await reachable(page, completed(page).getByRole("article").last(), "last completed card");
});

test("H-M2", "happy", PHONE, "Phone: the sidebar is hidden and the menu button opens it as a drawer", async (page) => {
  assert.equal(await page.getByRole("navigation", { name: "Main" }).isVisible(), false, "sidebar should be hidden on a phone");
  await menuButton(page).click();
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await drawer.getByRole("link", { name: "Dashboard" }).waitFor();
  await reachable(page, drawer.getByRole("link", { name: "Logout" }), "Logout link in drawer");
  return "drawer-open";
});

test("H-M3", "happy", PHONE, "Phone: the drawer closes with its close button", async (page) => {
  await menuButton(page).click();
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await drawer.getByRole("button", { name: "Close menu" }).click();
  await drawer.waitFor({ state: "hidden" });
});

test("H-M4", "happy", PHONE, "Phone: typing in search filters both lists", async (page) => {
  const search = page.getByRole("searchbox", { name: "Search tasks" });
  await reachable(page, search, "search box");
  await search.tap();
  await search.pressSequentially("client");
  assert.deepEqual(await titles(todo(page)), ["Landing Page Design for TravelDays"]);
  assert.deepEqual(await titles(completed(page)), ["Conduct meeting"]);
});

test("H-M5", "happy", PHONE, "Phone: tapping a task's circle moves it to Completed", async (page) => {
  const circle = page.getByRole("button", { name: 'Mark "Landing Page Design for TravelDays" as Completed' });
  await reachable(page, circle, "status circle");
  await circle.tap();
  assert.ok((await titles(completed(page))).includes("Landing Page Design for TravelDays"));
  assert.ok(!(await titles(todo(page))).includes("Landing Page Design for TravelDays"));
});

test("H-M6", "happy", PHONE, "Phone: Add task opens a dialog that fits the screen and adds the task", async (page) => {
  await reachable(page, todo(page).getByRole("button", { name: "Add task" }), "Add task button");
  await todo(page).getByRole("button", { name: "Add task" }).tap();
  const dialog = page.getByRole("dialog", { name: "Add task" });
  await dialog.waitFor();
  const box = await dialog.boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= PHONE.width, `dialog spans x ${box.x}..${box.x + box.width}`);
  await dialog.getByLabel("Title").fill("Buy train tickets");
  await dialog.getByLabel("Priority").selectOption("Extreme");
  await dialog.getByRole("button", { name: "Add" }).tap();
  await dialog.waitFor({ state: "hidden" });
  assert.equal((await titles(todo(page)))[0], "Buy train tickets");
  await noHorizontalOverflow(page);
});

test("H-M7", "happy", PHONE, "Phone: an added task survives a reload", async (page) => {
  await todo(page).getByRole("button", { name: "Add task" }).tap();
  const dialog = page.getByRole("dialog", { name: "Add task" });
  await dialog.getByLabel("Title").fill("Call the bank");
  await dialog.getByRole("button", { name: "Add" }).tap();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("region", { name: "Task Status" }).waitFor();
  assert.equal((await titles(todo(page)))[0], "Call the bank");
});

test("H-D1", "happy", DESKTOP, "Desktop 1440: keeps the Figma geometry (sidebar 330, To-Do 466, right column 423) and hides the menu button", async (page) => {
  assert.equal(await page.getByRole("navigation", { name: "Main" }).isVisible(), true);
  assert.equal(await menuButton(page).isVisible(), false);
  const width = async (locator) => Math.round((await locator.boundingBox()).width);
  assert.equal(await width(page.locator("aside:visible")), 330, "sidebar width");
  assert.equal(await width(todo(page)), 466, "To-Do width");
  assert.equal(await width(completed(page)), 423, "right column width");
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true, "desktop page itself should not scroll");
});

test("H-D2", "happy", DESKTOP, "Desktop: clicking search, a status circle and Add task all work", async (page) => {
  const search = page.getByRole("searchbox", { name: "Search tasks" });
  await search.click();
  await search.pressSequentially("dog");
  assert.deepEqual(await titles(completed(page)), ["Walk the dog"]);
  await search.fill("");
  await page.getByRole("button", { name: 'Mark "Landing Page Design for TravelDays" as Completed' }).click();
  assert.ok((await titles(completed(page))).includes("Landing Page Design for TravelDays"));
  await todo(page).getByRole("button", { name: "Add task" }).click();
  const dialog = page.getByRole("dialog", { name: "Add task" });
  await dialog.getByLabel("Title").fill("Review quarterly goals");
  await dialog.getByRole("button", { name: "Add" }).click();
  assert.equal((await titles(todo(page)))[0], "Review quarterly goals");
});

test("H-D3", "happy", { width: 1280, height: 720 }, "Laptop 1280: sidebar and both columns fit; both lists scroll inside their cards", async (page) => {
  assert.equal(await page.getByRole("navigation", { name: "Main" }).isVisible(), true);
  await reachable(page, page.getByRole("region", { name: "Task Status" }).locator("figure").last(), "Not Started donut");
  await reachable(page, completed(page).getByRole("article").last(), "last completed card");
  await reachable(page, todo(page).getByRole("article").last(), "last to-do card");
});

test("H-R1", "happy", DESKTOP, "Resize desktop to phone and back: layout switches without a reload", async (page) => {
  await page.setViewportSize(PHONE);
  await menuButton(page).waitFor();
  await noHorizontalOverflow(page);
  await page.setViewportSize(DESKTOP);
  await page.getByRole("navigation", { name: "Main" }).waitFor();
  assert.equal(await menuButton(page).isVisible(), false);
});

test("U-M1", "unhappy", PHONE, "Phone: a search with no match shows both empty states and stays inside the screen", async (page) => {
  const search = page.getByRole("searchbox", { name: "Search tasks" });
  await search.fill("zzz-no-such-task");
  await todo(page).getByText("No tasks to do.").waitFor();
  await completed(page).getByText("No completed tasks.").waitFor();
  await noHorizontalOverflow(page);
});

test("U-M2", "unhappy", PHONE, "Phone: a title of only spaces is rejected and nothing is added", async (page) => {
  const before = await titles(todo(page));
  await todo(page).getByRole("button", { name: "Add task" }).tap();
  const dialog = page.getByRole("dialog", { name: "Add task" });
  await dialog.getByLabel("Title").fill("   ");
  await dialog.getByRole("button", { name: "Add" }).tap();
  assert.equal(await dialog.isVisible(), true, "dialog should stay open");
  assert.equal(await dialog.getByLabel("Title").evaluate((el) => el.validity.valid), false);
  await page.keyboard.press("Escape");
  assert.deepEqual(await titles(todo(page)), before);
});

test("U-M3", "unhappy", PHONE, "Phone: Cancel in the Add task dialog adds nothing", async (page) => {
  const before = await titles(todo(page));
  await todo(page).getByRole("button", { name: "Add task" }).tap();
  const dialog = page.getByRole("dialog", { name: "Add task" });
  await dialog.getByLabel("Title").fill("Should not be saved");
  await dialog.getByRole("button", { name: "Cancel" }).tap();
  await dialog.waitFor({ state: "hidden" });
  assert.deepEqual(await titles(todo(page)), before);
});

for (const [id, viewport] of [["U-M4", PHONE], ["U-D4", DESKTOP]]) {
  test(id, "unhappy", viewport, `${viewport.width}px: a 136-character unbroken title and description do not widen the page or the card`, async (page) => {
    await todo(page).getByRole("button", { name: "Add task" }).click();
    const dialog = page.getByRole("dialog", { name: "Add task" });
    await dialog.getByLabel("Title").fill(LONG_WORD);
    await dialog.getByLabel("Description").fill(LONG_WORD);
    await dialog.getByRole("button", { name: "Add" }).click();
    await dialog.waitFor({ state: "hidden" });
    await noHorizontalOverflow(page);
    const card = todo(page).getByRole("article").first();
    const overflow = await card.evaluate((el) => el.scrollWidth - el.clientWidth);
    assert.ok(overflow <= 1, `card content overflows by ${overflow}px`);
  });
}

test("U-M5", "unhappy", PHONE, "Phone: the drawer closes with Escape and with a tap on the backdrop", async (page) => {
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await menuButton(page).click();
  await drawer.waitFor();
  await page.keyboard.press("Escape");
  await drawer.waitFor({ state: "hidden" });
  await menuButton(page).click();
  await drawer.waitFor();
  await page.mouse.click(PHONE.width - 10, PHONE.height / 2);
  await drawer.waitFor({ state: "hidden" });
});

test("U-M6", "unhappy", PHONE, "Phone: unreadable saved data falls back to the sample tasks and the layout still fits", async (page) => {
  assert.equal((await titles(todo(page))).length, 3);
  await noHorizontalOverflow(page);
}, "{not json");

test("U-M7", "unhappy", PHONE, "Phone: no tasks at all shows empty states and 0% donuts", async (page) => {
  await todo(page).getByText("No tasks to do.").waitFor();
  const donuts = await page.getByRole("region", { name: "Task Status" }).locator("figure").allInnerTexts();
  assert.deepEqual(donuts.map((t) => t.replace(/\s+/g, " ").trim()), ["0% Completed", "0% In Progress", "0% Not Started"]);
  await noHorizontalOverflow(page);
}, "[]");

test("U-L1", "unhappy", { width: 812, height: 375 }, "Phone landscape 812x375: every section is still reachable by scrolling", async (page) => {
  await noHorizontalOverflow(page);
  await reachable(page, todo(page).getByRole("article").last(), "last to-do card");
  await reachable(page, completed(page).getByRole("article").last(), "last completed card");
});

test("U-D5", "unhappy", { width: 1280, height: 560 }, "Short desktop window 1280x560: lists scroll inside their cards and the last card is reachable", async (page) => {
  await noHorizontalOverflow(page);
  await reachable(page, todo(page).getByRole("article").last(), "last to-do card");
  await reachable(page, completed(page).getByRole("article").last(), "last completed card");
});

test("U-R2", "unhappy", { width: 1024, height: 768 }, "Drawer left open while the window grows to desktop closes itself and the page stays clickable", async (page) => {
  await menuButton(page).click();
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await drawer.waitFor();
  await page.setViewportSize(DESKTOP);
  await drawer.waitFor({ state: "hidden" });
  const search = page.getByRole("searchbox", { name: "Search tasks" });
  await search.click({ timeout: 3000 });
  await search.pressSequentially("dog");
  assert.deepEqual(await titles(completed(page)), ["Walk the dog"]);
});

test("U-D6", "unhappy", DESKTOP, "Desktop: the drawer menu button is not reachable, so the sidebar is never shown twice", async (page) => {
  assert.equal(await menuButton(page).isVisible(), false);
  assert.equal(await page.getByRole("navigation", { name: "Main" }).count(), 1);
});

(async () => {
  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  for (const c of CASES) {
    const page = await open(browser, c.viewport, { storage: c.storage });
    const started = Date.now();
    let status = "pass";
    let error = null;
    try {
      await c.fn(page);
    } catch (e) {
      status = "fail";
      error = e.message.split("\n")[0];
    }
    const shot = `${c.id}.png`;
    await page.screenshot({ path: path.join(SHOTS, shot) });
    await page.context().close();
    results.push({ id: c.id, kind: c.kind, viewport: `${c.viewport.width}x${c.viewport.height}`, name: c.name, status, error, ms: Date.now() - started, shot });
    console.log(`${status.toUpperCase()} ${c.id} ${c.name}${error ? `\n     ${error}` : ""}`);
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, process.env.RESULTS ?? "results.json"), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => r.status === "fail").length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exitCode = failed ? 1 : 0;
})();
