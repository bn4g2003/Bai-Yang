"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { mainNavGroups } from "@/lib/nav-config";
import { SidebarNav } from "./SidebarNav";

const STORAGE_KEY = "app-shell-sidebar-collapsed";
const MOBILE_MQ = "(max-width: 767px)";

function subscribeMobile(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function getMobileServerSnapshot() {
  return false;
}

function readInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* ignore */
  }
  return window.matchMedia(MOBILE_MQ).matches;
}

type Props = {
  children: React.ReactNode;
};

export function AppShell({ children }: Props) {
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readInitialCollapsed);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const openMobileMenu = useCallback(() => setMobileOpen(true), []);
  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  const navIconOnly = !isMobile && sidebarCollapsed;
  const showMobileDrawer = isMobile && mobileOpen;

  return (
    <div className="flex min-h-full flex-1">
      {showMobileDrawer ? (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeMobileMenu}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 max-w-[85vw] flex-col border-r border-slate-200/90 bg-slate-50/95 transition-[width,transform] duration-200 dark:border-slate-800 dark:bg-slate-950 md:static ${
          navIconOnly ? "md:w-[4.5rem]" : "md:w-60"
        } ${isMobile ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : ""} md:translate-x-0`}
      >
        <div
          className={`flex h-14 shrink-0 items-center border-b border-slate-200/90 px-3 dark:border-slate-800 ${
            navIconOnly ? "md:justify-center md:px-2" : "justify-between"
          }`}
        >
          <div
            className={`flex min-w-0 items-center gap-2 ${
              navIconOnly ? "md:hidden" : ""
            }`}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--app-accent)] text-white shadow-sm"
              aria-hidden
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c-4 2.5-6 5.5-6 9a6 6 0 1012 0c0-3.5-2-6.5-6-9z"
                />
              </svg>
            </span>
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Ao nuôi
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
                Quản lý vùng
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isMobile) closeMobileMenu();
              else toggleSidebar();
            }}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={navIconOnly ? "Mở rộng menu" : "Thu gọn menu"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {navIconOnly ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav
            groups={mainNavGroups}
            collapsed={navIconOnly}
            onNavigate={closeMobileMenu}
          />
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/90 bg-white/95 px-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
          <button
            type="button"
            onClick={openMobileMenu}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Mở menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">Ao nuôi</span>
        </header>
        <main className="min-w-0 flex-1 bg-[var(--background)] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
