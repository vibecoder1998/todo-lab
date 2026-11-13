import Image from "next/image";
import { NEXT_STATUS, type Priority, type Status, type Task } from "@/lib/tasks";

export const STATUS_COLOR: Record<Status, string> = {
  "Not Started": "var(--tone-red)",
  "In Progress": "var(--tone-blue)",
  Completed: "var(--tone-green)",
};

const PRIORITY_COLOR: Record<Priority, string> = {
  Extreme: "var(--tone-red)",
  Moderate: "var(--tone-sky)",
  Low: "var(--tone-green)",
};

const date = new Intl.DateTimeFormat("en-GB");
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(iso: string, now: Date) {
  const days = Math.round((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days < 30) return relative.format(-days, "day");
  if (days < 365) return relative.format(-Math.round(days / 30), "month");
  return relative.format(-Math.round(days / 365), "year");
}

type Props = { task: Task; now: Date; onAdvance: () => void };

export default function TaskCard({ task, now, onAdvance }: Props) {
  const done = task.status === "Completed";
  const statusLine = (
    <span>
      Status: <span style={{ color: STATUS_COLOR[task.status] }}>{task.status}</span>
    </span>
  );

  return (
    <article
      className={`relative flex flex-col rounded-[14px] border border-muted px-[13px] ${
        done ? "min-h-[134px] py-[9px]" : "min-h-[166px] py-[12px]"
      }`}
    >
      <div className={`flex gap-[13px] ${done ? "pr-[72px] sm:pr-[98px]" : "pr-[80px] sm:pr-[115px]"}`}>
        <button
          type="button"
          onClick={onAdvance}
          aria-label={`Mark "${task.title}" as ${NEXT_STATUS[task.status]}`}
          className="-m-[5px] shrink-0 cursor-pointer self-start p-[5px]"
        >
          <span
            className="block size-[14px] rounded-full border-2"
            style={{ borderColor: STATUS_COLOR[task.status] }}
          />
        </button>
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold wrap-anywhere">{task.title}</h3>
          <p className={`text-[14px] text-subtle wrap-anywhere ${done ? "mt-[13px] line-clamp-2" : "mt-[10px] line-clamp-4"}`}>
            {task.description}
          </p>
        </div>
      </div>

      {done ? (
        <div className="mt-auto pt-[13px] pl-[27px] text-[10px]">
          {statusLine}
          <p className="mt-[11px] font-medium text-subtle">Completed {timeAgo(task.completedAt ?? task.createdAt, now)}.</p>
        </div>
      ) : (
        <div className="mt-auto flex flex-wrap gap-y-1 pt-[8px] pl-[27px] text-[10px] whitespace-nowrap">
          <span className="w-[98px]">
            Priority: <span style={{ color: PRIORITY_COLOR[task.priority] }}>{task.priority}</span>
          </span>
          <span className="w-[117px]">{statusLine}</span>
          <span className="text-muted">Created on: {date.format(new Date(task.createdAt))}</span>
        </div>
      )}

      {task.image && (
        <Image
          src={task.image}
          alt=""
          width={88}
          height={88}
          className={`absolute top-1/2 size-[56px] -translate-y-1/2 rounded-[14px] object-cover sm:size-[88px] ${
            done ? "right-[13px]" : "right-[13px] sm:right-[30px]"
          }`}
        />
      )}
      <Image
        src="/icons/menu.svg"
        alt=""
        width={15.17}
        height={4.64007}
        className={`absolute top-[9px] ${done ? "right-[15px]" : "right-[13px]"}`}
      />
    </article>
  );
}
