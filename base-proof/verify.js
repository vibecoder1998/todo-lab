// Usage: NODE_PATH=<playwright node_modules> node verify.js [baseUrl]
const { chromium } = require("playwright");
const assert = require("assert/strict");
const path = require("path");

const BASE = process.argv[2] ?? "http://localhost:3100/";
const shot = (page, name) => page.screenshot({ path: path.join(__dirname, name) });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  // Freeze the clock at the design's date so the header and "Completed 2 days ago" match Figma.
  await page.clock.setFixedTime(new Date("2023-06-20T10:00:00"));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

  const todo = page.getByRole("region", { name: "To-Do" });
  const completed = page.getByRole("region", { name: "Completed Task" });
  const status = page.getByRole("region", { name: "Task Status" });
  const titles = (region) => region.getByRole("heading", { level: 3 }).allInnerTexts();
  const donuts = async () => (await status.locator("figure").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());

  await todo.getByRole("heading", { level: 3 }).first().waitFor();
  await page.waitForTimeout(300);
  assert.deepEqual(await titles(todo), [
    "Attend Nischal’s Birthday Party",
    "Landing Page Design for TravelDays",
    "Presentation on Final Product",
  ]);
  assert.deepEqual(await titles(completed), ["Walk the dog", "Conduct meeting"]);
  assert.deepEqual(await donuts(), ["40% Completed", "40% In Progress", "20% Not Started"]);
  await shot(page, "dashboard.png");
  console.log("PASS seed dashboard renders, screenshot dashboard.png");

  const search = page.getByRole("searchbox", { name: "Search tasks" });
  await search.click();
  await search.pressSequentially("client");
  assert.deepEqual(await titles(todo), ["Landing Page Design for TravelDays"]);
  assert.deepEqual(await titles(completed), ["Conduct meeting"]);
  await shot(page, "check-1-search.png");
  console.log('PASS search "client" leaves 1 to-do and 1 completed task, screenshot check-1-search.png');
  await search.fill("");
  assert.equal((await titles(todo)).length, 3);

  await page.getByRole("button", { name: 'Mark "Landing Page Design for TravelDays" as Completed' }).click();
  assert.deepEqual(await titles(todo), ["Attend Nischal’s Birthday Party", "Presentation on Final Product"]);
  assert.ok((await titles(completed)).includes("Landing Page Design for TravelDays"));
  assert.deepEqual(await donuts(), ["60% Completed", "20% In Progress", "20% Not Started"]);
  await page.getByRole("button", { name: 'Mark "Attend Nischal’s Birthday Party" as In Progress' }).click();
  assert.deepEqual(await donuts(), ["60% Completed", "40% In Progress", "0% Not Started"]);
  await shot(page, "check-2-status.png");
  console.log("PASS circle clicks advance status and donuts change 40/40/20 -> 60/20/20 -> 60/40/0, screenshot check-2-status.png");

  await todo.getByRole("button", { name: "Add task" }).click();
  const dialog = page.getByRole("dialog", { name: "Add task" });
  await dialog.getByLabel("Title").pressSequentially("Prepare workshop slides");
  await dialog.getByLabel("Description").pressSequentially("Outline the seven A/B parts.");
  await dialog.getByLabel("Priority").selectOption("Extreme");
  await shot(page, "check-3-add-task-form.png");
  await dialog.getByRole("button", { name: "Add" }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal((await titles(todo))[0], "Prepare workshop slides");
  const card = todo.getByRole("article").filter({ hasText: "Prepare workshop slides" });
  assert.match(await card.innerText(), /Priority: Extreme[\s\S]*Status: Not Started/);
  assert.deepEqual(await donuts(), ["50% Completed", "33% In Progress", "17% Not Started"]);
  await shot(page, "check-3-add-task.png");
  console.log("PASS Add task adds a Not Started Extreme task and donuts become 50/33/17, screenshots check-3-add-task-form.png, check-3-add-task.png");

  await page.reload({ waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await todo.getByRole("heading", { level: 3 }).first().waitFor();
  assert.deepEqual(await titles(todo), [
    "Prepare workshop slides",
    "Attend Nischal’s Birthday Party",
    "Presentation on Final Product",
  ]);
  assert.ok((await titles(completed)).includes("Landing Page Design for TravelDays"));
  assert.deepEqual(await donuts(), ["50% Completed", "33% In Progress", "17% Not Started"]);
  await shot(page, "check-4-reload.png");
  console.log("PASS state survives a reload, screenshot check-4-reload.png");

  await browser.close();
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
