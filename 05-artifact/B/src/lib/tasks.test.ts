import { beforeEach, describe, expect, it, vi } from "vitest";
import { addTask, loadTasks, setStatus, statusStats, type Task } from "./tasks";

beforeEach(() => {
  const items = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
  });
});

const task = (status: Task["status"]): Task => ({
  id: crypto.randomUUID(),
  title: "t",
  description: "",
  priority: "Low",
  status,
  createdAt: "2023-06-20T12:00:00.000Z",
});

describe("statusStats", () => {
  it("returns the share of tasks in each status as whole percentages", () => {
    const tasks = [task("Completed"), task("Completed"), task("In Progress"), task("Not Started")];
    expect(statusStats(tasks)).toEqual({ Completed: 50, "In Progress": 25, "Not Started": 25 });
  });

  it("rounds to the nearest percent", () => {
    const tasks = [task("Completed"), task("In Progress"), task("Not Started")];
    expect(statusStats(tasks)).toEqual({ Completed: 33, "In Progress": 33, "Not Started": 33 });
  });

  it("returns zeros for an empty list", () => {
    expect(statusStats([])).toEqual({ Completed: 0, "In Progress": 0, "Not Started": 0 });
  });
});

describe("loadTasks", () => {
  it("starts from the five seed tasks when nothing is stored", () => {
    expect(loadTasks().map((t) => t.title)).toEqual([
      "Attend Nischal’s Birthday Party",
      "Landing Page Design for TravelDays",
      "Presentation on Final Product",
      "Walk the dog",
      "Conduct meeting",
    ]);
  });
});

describe("addTask", () => {
  it("adds a Not Started task that is still there on the next load", () => {
    addTask({ title: "Buy milk", description: "Two litres", priority: "Low" });

    const tasks = loadTasks();
    expect(tasks).toHaveLength(6);
    expect(tasks.find((t) => t.title === "Buy milk")).toMatchObject({
      description: "Two litres",
      priority: "Low",
      status: "Not Started",
    });
  });
});

describe("setStatus", () => {
  it("persists the new status and stamps completedAt when completed", () => {
    const [first] = loadTasks();
    setStatus(first.id, "Completed");

    const saved = loadTasks().find((t) => t.id === first.id);
    expect(saved?.status).toBe("Completed");
    expect(saved?.completedAt).toBeDefined();
  });

  it("clears completedAt when a completed task is reopened", () => {
    const done = loadTasks().find((t) => t.status === "Completed")!;
    setStatus(done.id, "Not Started");

    const saved = loadTasks().find((t) => t.id === done.id);
    expect(saved?.status).toBe("Not Started");
    expect(saved?.completedAt).toBeUndefined();
  });

  it("leaves the other tasks unchanged", () => {
    const before = loadTasks();
    setStatus(before[0].id, "In Progress");
    expect(loadTasks().slice(1)).toEqual(before.slice(1));
  });
});
