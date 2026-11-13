"use client";

import Image from "next/image";
import { useRef, type FormEvent } from "react";
import type { NewTask, Priority } from "@/lib/tasks";

const FIELD = "mt-1 w-full rounded-[8px] border border-muted px-3 py-2 text-[14px] text-ink";

export default function AddTask({ onAdd }: { onAdd: (task: NewTask) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget);
    onAdd({
      title: String(form.get("title")).trim(),
      description: String(form.get("description")).trim(),
      priority: form.get("priority") as Priority,
    });
    event.currentTarget.reset();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="flex cursor-pointer items-center gap-[6px] text-[12px] text-muted"
      >
        <Image src="/icons/add.svg" alt="" width={15} height={15} />
        Add task
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="add-task-title"
        className="m-auto w-[420px] rounded-[14px] bg-surface p-6 backdrop:bg-black/40"
      >
        <form method="dialog" onSubmit={submit} className="flex flex-col gap-4 text-[14px] font-medium">
          <h2 id="add-task-title" className="text-[16px] font-semibold">
            Add task
          </h2>
          <label>
            Title
            <input name="title" required pattern=".*\S.*" className={FIELD} />
          </label>
          <label>
            Description
            <textarea name="description" rows={3} className={FIELD} />
          </label>
          <label>
            Priority
            <select name="priority" defaultValue="Moderate" className={FIELD}>
              <option>Extreme</option>
              <option>Moderate</option>
              <option>Low</option>
            </select>
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="cursor-pointer rounded-[8px] border border-muted px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="cursor-pointer rounded-[8px] bg-brand px-4 py-2 text-white">
              Add
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
