type Props = { label: string; percent: number; color: string };

export default function StatusDonut({ label, percent, color }: Props) {
  return (
    <figure className="flex min-w-0 flex-col items-center sm:w-[100px] sm:shrink-0">
      <div className="relative size-[72px] sm:size-[100px]">
        <svg viewBox="0 0 100 100" className="size-full -scale-x-100" aria-hidden>
          <circle cx="50" cy="50" r="44.5" fill="none" className="stroke-track" strokeWidth="11" />
          <circle
            cx="50"
            cy="50"
            r="44.5"
            fill="none"
            style={{ stroke: color }}
            strokeWidth="11"
            pathLength={100}
            strokeDasharray={`${percent} 100`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[16px] font-medium sm:text-[20px]">{percent}%</span>
      </div>
      <figcaption className="mt-3 flex items-center gap-[7px] text-[12px] font-medium whitespace-nowrap sm:mt-[19px] sm:text-[15px]">
        <span className="size-[7px] rounded-full" style={{ backgroundColor: color }} />
        {label}
      </figcaption>
    </figure>
  );
}
