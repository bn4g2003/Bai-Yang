"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useCallback, useState } from "react";
import type { NavGroup } from "@/lib/nav-config";
import { NavIcon } from "./NavIcons";

type Props = {
  groups: NavGroup[];
  collapsed: boolean;
  onNavigate?: () => void;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function navLinkClass(active: boolean, collapsed: boolean) {
  const base =
    "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/40";
  if (collapsed) {
    return `${base} justify-center px-2 py-2.5 ${
      active
        ? "bg-[var(--app-accent)] text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
    }`;
  }
  return `${base} px-3 py-2.5 ${
    active
      ? "bg-[var(--app-accent)] text-white shadow-sm"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
  }`;
}

export function SidebarNav({ groups, collapsed, onNavigate }: Props) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of groups) init[g.id] = g.defaultOpen !== false;
    return init;
  });

  const toggleGroup = useCallback((id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    // Chỉ khớp đúng trang mục lục, tránh sáng cả “Hướng dẫn” khi đang ở /bao-cao/...
    if (href === "/bao-cao") return pathname === "/bao-cao";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-4" aria-label="Điều hướng chính">
      {groups.map((group, groupIndex) => {
        const open = openGroups[group.id] !== false;
        const showItems = collapsed || open;

        if (collapsed) {
          return (
            <Fragment key={group.id}>
              {groupIndex > 0 ? (
                <div className="mx-1 my-3 h-px bg-slate-200 dark:bg-slate-700/80" aria-hidden />
              ) : null}
              <ul className="space-y-1" role="list">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        title={item.label}
                        className={navLinkClass(active, true)}
                      >
                        <NavIcon
                          id={item.icon}
                          className={active ? "text-white" : "text-slate-500 dark:text-slate-400"}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Fragment>
          );
        }

        return (
          <div key={group.id} className="mb-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100/80 dark:text-slate-500 dark:hover:bg-slate-800/50"
            >
              <span className="truncate">{group.label}</span>
              <Chevron open={open} />
            </button>
            {showItems ? (
              <ul className="mt-0.5 space-y-0.5 border-l border-slate-200/90 pl-2 dark:border-slate-700/80 ml-2" role="list">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={navLinkClass(active, false)}
                      >
                        <NavIcon
                          id={item.icon}
                          className={active ? "text-white" : "text-slate-500 dark:text-slate-400"}
                        />
                        <span className="min-w-0 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
