"use client";

import Image from "next/image";
import { useState } from "react";
import { addTask, loadTasks, NEXT_STATUS, setStatus, statusStats, type Status, type Task } from "@/lib/tasks";
import AddTask from "./AddTask";
import Sidebar, { MenuDrawer } from "./Sidebar";
import StatusDonut from "./StatusDonut";
import TaskCard, { STATUS_COLOR } from "./TaskCard";
import ThemeToggle from "./ThemeToggle";

const DONUTS: Status[] = ["Completed", "In Progress", "Not Started"];
const CARD =
  "rounded-[14px] bg-card shadow-[0_19px_19px_rgba(0,0,0,0.03),0_5px_11px_rgba(0,0,0,0.04)]";

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
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-y-auto">
      <header className="flex shrink-0 flex-wrap items-center gap-3 bg-header px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.07)] lg:h-[100px] lg:flex-nowrap lg:items-start lg:gap-0 lg:px-10 lg:pt-[38px] lg:pb-0 desk:pr-[76px] desk:pl-[72px]">
        <MenuDrawer />
        <h1 className="text-[24px] font-semibold lg:-mt-[1px] lg:mr-10 lg:ml-4 lg:text-[32px] xl:ml-0 desk:mr-0 desk:w-[319px]">
          <span className="text-brand">Dash</span>board
        </h1>
        <div
          role="search"
          className="relative order-last flex h-[36px] w-full items-center rounded-[8px] lg:order-none lg:mr-4 lg:max-w-[695px] lg:min-w-0 lg:flex-1 bg-page shadow-[-4px_17px_18px_rgba(0,0,0,0.03),-1px_4px_10px_rgba(0,0,0,0.04)]"
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
        <ThemeToggle className="ml-auto lg:mr-[24px]" />
        <p className="w-[81px] font-medium">
          <span className="block text-[15px]">{now.toLocaleDateString("en-GB", { weekday: "long" })}</span>
          <span className="block text-[14px] text-[#3abeff]">{now.toLocaleDateString("en-GB")}</span>
        </p>
      </header>

      <div className="flex flex-1 lg:min-h-0">
        <Sidebar className="mt-[56px] hidden w-[250px] rounded-r-[8px] xl:flex desk:w-[330px]" />
        <main className="flex min-w-0 flex-1 flex-col px-4 py-6 lg:min-h-0 lg:px-10 lg:pt-[57px] lg:pb-[31px] desk:px-[76px]">
          <h2 className="flex items-center gap-[8px] text-[24px] font-medium lg:text-[36px] lg:leading-[34px]">
            Welcome back, Sundar
            <Image src="/icons/hand-wave.svg" alt="" width={42.4228} height={41} className="w-[28px] lg:w-auto" />
          </h2>

          <div className="mt-6 flex flex-col gap-4 border border-muted/60 p-3 shadow-[0_4px_4px_rgba(0,0,0,0.25)] lg:mt-[34px] lg:max-h-[761px] lg:min-h-[360px] lg:flex-1 lg:flex-row lg:pt-[21px] lg:pr-[26px] lg:pb-[19px] lg:pl-[25px]">
            <section aria-labelledby="todo-title" className={`${CARD} flex min-w-0 flex-col lg:max-w-[466px] lg:flex-[466_1_0%]`}>
              <div className="flex items-start justify-between px-4 pt-[20px] sm:pr-[41px] sm:pl-[23px]">
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
              <ul className="mt-[18px] pb-[20px] lg:flex-1 lg:overflow-y-auto">
                {todo.map((task, i) => (
                  <li
                    key={task.id}
                    className={
                      i > 0 && day(task.createdAt) !== day(todo[i - 1].createdAt)
                        ? "mt-[35px] border-t border-muted px-3 pt-[35px] sm:px-[33px]"
                        : `px-3 sm:px-[33px] ${i > 0 ? "mt-[10px]" : ""}`
                    }
                  >
                    <TaskCard task={task} now={now} onAdvance={() => advance(task)} />
                  </li>
                ))}
                {todo.length === 0 && <li className="px-3 text-[14px] text-subtle sm:px-[33px]">No tasks to do.</li>}
              </ul>
            </section>

            <div className="flex min-w-0 flex-col gap-4 lg:max-w-[423px] lg:flex-[423_1_0%] lg:gap-[17px] lg:pt-[3px]">
              <section aria-labelledby="status-title" className={`${CARD} px-4 pt-[24px] pb-6 sm:px-[25px] lg:h-[263px] lg:pb-0`}>
                <h2 id="status-title" className="flex items-center gap-[9px] text-[15px] font-medium text-brand">
                  <Image src="/icons/task-status.svg" alt="" width={23} height={22.7} />
                  Task Status
                </h2>
                <div className="mt-6 grid grid-cols-3 justify-items-center gap-2 sm:mt-[35px] sm:-ml-[4px] sm:flex sm:gap-[40px]">
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
                <ul className="mt-[23px] flex flex-col gap-[10px] px-3 pb-[20px] sm:px-[42px] lg:flex-1 lg:overflow-y-auto">
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
