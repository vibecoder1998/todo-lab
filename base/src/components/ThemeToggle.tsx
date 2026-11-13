"use client";

import { useState } from "react";
import { applyTheme } from "@/lib/theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === "dark");

  function toggle() {
    applyTheme(dark ? "light" : "dark");
    setDark(!dark);
  }

  return (
    <button
      type="button"
      aria-label="Dark mode"
      aria-pressed={dark}
      onClick={toggle}
      className={`grid size-[36px] shrink-0 cursor-pointer place-items-center rounded-[8px] shadow-[-4px_17px_18px_rgba(0,0,0,0.03),-1px_4px_10px_rgba(0,0,0,0.04)] ${
        dark ? "bg-brand text-white" : "bg-page text-subtle"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
