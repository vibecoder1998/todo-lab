"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const NAV = [
  { label: "Dashboard", icon: "/icons/nav-dashboard.svg", width: 24, height: 24, current: true },
  { label: "Vital Task", icon: "/icons/nav-vital-task.svg", width: 7.75, height: 20 },
  { label: "My Task", icon: "/icons/nav-my-task.svg", width: 24, height: 24 },
  { label: "Task Categories", icon: "/icons/nav-task-categories.svg", width: 24, height: 24 },
  { label: "Settings", icon: "/icons/nav-settings.svg", width: 24, height: 24 },
  { label: "Help", icon: "/icons/nav-help.svg", width: 24, height: 24 },
];

const ITEM = "flex h-[59px] items-center gap-[16px] rounded-[14px] px-[16px] text-[16px] font-medium";

export default function Sidebar({ className }: { className: string }) {
  return (
    <aside className={`min-h-0 shrink-0 flex-col bg-brand px-[21px] text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${className}`}>
      <div className="-mt-[44px] mr-[26px] flex flex-col items-center">
        <Image src="/images/profile.png" alt="" width={86} height={86} className="rounded-full" priority />
        <p className="mt-[13px] text-[16px] font-semibold">Sundar Gurung</p>
        <p className="mt-[2px] text-[12px]">sundargurung360@gmail.com</p>
      </div>
      <nav aria-label="Main" className="mt-[18px] flex-1">
        <ul className="flex flex-col gap-[10px]">
          {NAV.map((item) => (
            <li key={item.label}>
              <a
                href="#"
                aria-current={item.current ? "page" : undefined}
                className={`${ITEM} ${item.current ? "bg-white text-brand" : ""}`}
              >
                <span className="flex w-[24px] justify-center">
                  <Image src={item.icon} alt="" width={item.width} height={item.height} />
                </span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a href="#" className={`${ITEM} mb-[31px]`}>
        <span className="flex w-[24px] justify-center">
          <Image src="/icons/nav-logout.svg" alt="" width={24} height={24} />
        </span>
        Logout
      </a>
    </aside>
  );
}

export function MenuDrawer() {
  const dialog = useRef<HTMLDialogElement>(null);

  // A drawer left open while the window grows past xl would keep the page inert behind it.
  useEffect(() => {
    const desktop = matchMedia("(min-width: 80rem)");
    const close = () => desktop.matches && dialog.current?.close();
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => dialog.current?.showModal()}
        className="grid size-[36px] shrink-0 cursor-pointer place-items-center rounded-[8px] bg-brand text-white xl:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-[20px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <dialog
        ref={dialog}
        aria-label="Menu"
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target === event.currentTarget || target.closest("a")) dialog.current?.close();
        }}
        className="m-0 h-dvh max-h-none w-[min(330px,85vw)] bg-transparent backdrop:bg-black/40"
      >
        <Sidebar className="flex h-full pt-[56px]" />
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => dialog.current?.close()}
          className="absolute top-3 right-3 grid size-[36px] cursor-pointer place-items-center text-white"
        >
          <svg viewBox="0 0 24 24" className="size-[20px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </dialog>
    </>
  );
}
