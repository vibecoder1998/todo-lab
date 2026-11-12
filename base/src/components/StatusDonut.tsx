type Props = { label: string; percent: number; color: string };

export default function StatusDonut({ label, percent, color }: Props) {
  return (
    <figure className="flex w-[100px] flex-col items-center">
      <div className="relative size-[100px]">
        <svg viewBox="0 0 100 100" className="size-full -scale-x-100" aria-hidden>
          <circle cx="50" cy="50" r="44.5" fill="none" stroke="#d9d9d9" strokeWidth="11" />
          <circle
            cx="50"
            cy="50"
            r="44.5"
            fill="none"
            stroke={color}
            strokeWidth="11"
            pathLength={100}
            strokeDasharray={`${percent} 100`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[20px] font-medium">{percent}%</span>
      </div>
      <figcaption className="mt-[19px] flex items-center gap-[7px] text-[15px] font-medium whitespace-nowrap">
        <span className="size-[7px] rounded-full" style={{ backgroundColor: color }} />
        {label}
      </figcaption>
    </figure>
  );
}
