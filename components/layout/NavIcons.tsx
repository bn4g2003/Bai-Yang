import type { NavIconId } from "@/lib/nav-config";

const stroke = "stroke-current";
const base = "h-[18px] w-[18px] shrink-0";

export function NavIcon({ id, className = "" }: { id: NavIconId; className?: string }) {
  const c = `${base} ${stroke} ${className}`.trim();
  switch (id) {
    case "dashboard":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 13h4v8H4v-8zm6-9h4v17h-4V4zm6 5h4v12h-4V9z"
          />
        </svg>
      );
    case "ponds":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3c-4 2.5-6 5.5-6 9a6 6 0 1012 0c0-3.5-2-6.5-6-9z"
          />
        </svg>
      );
    case "journal":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5z"
          />
        </svg>
      );
    case "reportHarvest":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 19V5m0 14h16M8 17V9m4 8V7m4 10v-4"
          />
        </svg>
      );
    case "reportEnv":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1M5.6 5.6l.7.7m11.4 11.4l.7.7M3 12h1m16 0h1M5.6 18.4l.7-.7M18.3 5.6l.7-.7"
          />
          <circle cx={12} cy={12} r={4} strokeWidth={1.75} />
        </svg>
      );
    case "settings":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <circle cx={12} cy={12} r={3} strokeWidth={1.75} />
        </svg>
      );
    case "agents":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm12 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
          />
        </svg>
      );
  }
}
