import Image from "next/image";

const NAV = [
  { label: "Dashboard", icon: "/icons/nav-dashboard.svg", width: 24, height: 24, current: true },
  { label: "Vital Task", icon: "/icons/nav-vital-task.svg", width: 7.75, height: 20 },
  { label: "My Task", icon: "/icons/nav-my-task.svg", width: 24, height: 24 },
  { label: "Task Categories", icon: "/icons/nav-task-categories.svg", width: 24, height: 24 },
  { label: "Settings", icon: "/icons/nav-settings.svg", width: 24, height: 24 },
  { label: "Help", icon: "/icons/nav-help.svg", width: 24, height: 24 },
];

const ITEM = "flex h-[59px] items-center gap-[16px] rounded-[14px] px-[16px] text-[16px] font-medium";

export default function Sidebar() {
  return (
    <aside className="mt-[56px] flex w-[330px] shrink-0 flex-col rounded-r-[8px] bg-brand px-[21px] text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
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
