import seed from "../../data/tasks.json";

export type Priority = "Extreme" | "Moderate" | "Low";
export type Status = "Not Started" | "In Progress" | "Completed";
export type Task = {
  id: string;
  title: string;
  description: string;
  image?: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  completedAt?: string;
};
export type NewTask = Pick<Task, "title" | "description" | "priority">;

export const NEXT_STATUS: Record<Status, Status> = {
  "Not Started": "In Progress",
  "In Progress": "Completed",
  Completed: "Not Started",
};

const STORAGE_KEY = "todo-lab.tasks";

export function loadTasks(): Task[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (Array.isArray(stored)) return stored;
  } catch {
    // Unreadable storage falls back to the seed data below.
  }
  return seed as Task[];
}

export function saveTasks(tasks: Task[]): Task[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  return tasks;
}

export function addTask(input: NewTask): Task[] {
  const task: Task = {
    id: crypto.randomUUID(),
    ...input,
    status: "Not Started",
    createdAt: new Date().toISOString(),
  };
  return saveTasks([task, ...loadTasks()]);
}

export function setStatus(id: string, status: Status): Task[] {
  return saveTasks(
    loadTasks().map((task) =>
      task.id === id
        ? {
            ...task,
            status,
            completedAt: status === "Completed" ? new Date().toISOString() : undefined,
          }
        : task,
    ),
  );
}

export function removeTask(id: string): Task[] {
  return saveTasks(loadTasks().filter((task) => task.id !== id));
}

export function statusStats(tasks: Task[]): Record<Status, number> {
  const percent = (status: Status) =>
    tasks.length === 0
      ? 0
      : Math.round((tasks.filter((task) => task.status === status).length / tasks.length) * 100);
  return {
    Completed: percent("Completed"),
    "In Progress": percent("In Progress"),
    "Not Started": percent("Not Started"),
  };
}
