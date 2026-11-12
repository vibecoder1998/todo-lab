"use client";

import Image from "next/image";
import { useState } from "react";
import { addTask, loadTasks, NEXT_STATUS, setStatus, statusStats, type Status, type Task } from "@/lib/tasks";
import AddTask from "./AddTask";
import Sidebar from "./Sidebar";
import StatusDonut from "./StatusDonut";
import TaskCard, { STATUS_COLOR } from "./TaskCard";

const DONUTS: Status[] = ["Completed", "In Progress", "Not Started"];
const CARD =
  "rounded-[14px] bg-page shadow-[0_19px_19px_rgba(0,0,0,0.03),0_5px_11px_rgba(0,0,0,0.04)]";

function matches(task: Task, query: string) {
  return `${task.title}\n${task.description}`.toLowerCase().includes(query.trim().toLowerCase());
}

const day = (iso: string) => new Date(iso).toDateString();

export default function Dashboard() {
  const [tasks, setTasks] = useState(loadTasks);
  const [query, setQuery] = useState("");
  const [now] = useState(() => new Date());

  const visible = tasks.filter((task) => matches(task, query));
  const todo = visible.filter((task) => task.status !== "Completed");
  const completed = visible.filter((task) => task.status === "Completed");
  const stats = statusStats(tasks);
  const advance = (task: Task) => setTasks(setStatus(task.id, NEXT_STATUS[task.status]));

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex h-[100px] shrink-0 items-start bg-[#f8f8f8] pt-[38px] pr-[76px] pl-[72px] shadow-[0_4px_12px_rgba(0,0,0,0.07)]">
        <h1 className="-mt-[1px] w-[319px] text-[32px] font-semibold">
          <span className="text-brand">Dash</span>board
        </h1>
        <div
          role="search"
          className="relative flex h-[36px] w-[695px] items-center rounded-[8px] bg-page shadow-[-4px_17px_18px_rgba(0,0,0,0.03),-1px_4px_10px_rgba(0,0,0,0.04)]"
        >
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search your task here..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-full flex-1 bg-transparent pr-[48px] pl-[15px] font-display text-[12px] font-semibold outline-none placeholder:text-muted"
          />
          <Image src="/icons/search.svg" alt="" width={36} height={36} className="absolute right-0" />
        </div>
        <p className="ml-auto w-[81px] font-medium">
          <span className="block text-[15px]">{now.toLocaleDateString("en-GB", { weekday: "long" })}</span>
          <span className="block text-[14px] text-[#3abeff]">{now.toLocaleDateString("en-GB")}</span>
        </p>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex min-h-0 flex-1 flex-col px-[76px] pt-[57px] pb-[31px]">
          <h2 className="flex items-center gap-[8px] text-[36px] leading-[34px] font-medium">
            Welcome back, Sundar
            <Image src="/icons/hand-wave.svg" alt="" width={42.4228} height={41} />
          </h2>

          <div className="mt-[34px] flex max-h-[761px] min-h-0 flex-1 gap-[16px] border border-muted/60 pt-[21px] pr-[26px] pb-[19px] pl-[25px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
            <section aria-labelledby="todo-title" className={`${CARD} flex w-[466px] flex-col`}>
              <div className="flex items-start justify-between pt-[20px] pr-[41px] pl-[23px]">
                <div>
                  <h2 id="todo-title" className="flex items-start gap-[4px] text-[15px] font-medium text-brand">
                    <Image src="/icons/todo.svg" alt="" width={28.6844} height={32.1713} />
                    <span className="mt-[4px]">To-Do</span>
                  </h2>
                  <p className="mt-[9px] flex items-center pl-[1px] text-[12px]">
                    {now.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
                    <Image src="/icons/dot.svg" alt="" width={8} height={8} className="ml-[12px]" />
                    <span className="text-muted">Today</span>
                  </p>
                </div>
                <div className="pt-[7px]">
                  <AddTask onAdd={(input) => setTasks(addTask(input))} />
                </div>
              </div>
              <ul className="mt-[18px] flex-1 overflow-y-auto pb-[20px]">
                {todo.map((task, i) => (
                  <li
                    key={task.id}
                    className={
                      i > 0 && day(task.createdAt) !== day(todo[i - 1].createdAt)
                        ? "mt-[35px] border-t border-muted px-[33px] pt-[35px]"
                        : `px-[33px] ${i > 0 ? "mt-[10px]" : ""}`
                    }
                  >
                    <TaskCard task={task} now={now} onAdvance={() => advance(task)} />
                  </li>
                ))}
                {todo.length === 0 && <li className="px-[33px] text-[14px] text-subtle">No tasks to do.</li>}
              </ul>
            </section>

            <div className="flex w-[423px] flex-col gap-[17px] pt-[3px]">
              <section aria-labelledby="status-title" className={`${CARD} h-[263px] px-[25px] pt-[24px]`}>
                <h2 id="status-title" className="flex items-center gap-[9px] text-[15px] font-medium text-brand">
                  <Image src="/icons/task-status.svg" alt="" width={23} height={22.7} />
                  Task Status
                </h2>
                <div className="mt-[35px] -ml-[4px] flex gap-[40px]">
                  {DONUTS.map((status) => (
                    <StatusDonut key={status} label={status} percent={stats[status]} color={STATUS_COLOR[status]} />
                  ))}
                </div>
              </section>

              <section aria-labelledby="completed-title" className={`${CARD} flex min-h-0 flex-1 flex-col`}>
                <h2
                  id="completed-title"
                  className="flex items-center gap-[11px] pt-[24px] pl-[24px] text-[15px] font-medium text-accent"
                >
                  <Image src="/icons/completed-task.svg" alt="" width={21} height={24} />
                  Completed Task
                </h2>
                <ul className="mt-[23px] flex flex-1 flex-col gap-[10px] overflow-y-auto px-[42px] pb-[20px]">
                  {completed.map((task) => (
                    <li key={task.id}>
                      <TaskCard task={task} now={now} onAdvance={() => advance(task)} />
                    </li>
                  ))}
                  {completed.length === 0 && <li className="text-[14px] text-subtle">No completed tasks.</li>}
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
