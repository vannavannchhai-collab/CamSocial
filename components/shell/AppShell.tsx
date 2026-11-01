"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Wallet, FileText, CalendarDays, Settings,
  Building2, Printer, ChevronLeft, Menu, Search, Bell, HelpCircle,
  BadgeCheck, Calculator, BookOpen, ArrowLeftRight, Library, X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/ui";

const NAV = [
  { section: "ទូទៅ", items: [
    { href: "/", label: "ផ្ទាំងគ្រប់គ្រង", icon: LayoutDashboard },
    { href: "/employees", label: "បុគ្គលិក", icon: Users },
  ]},
  { section: "បៀវត្សរ៍", items: [
    { href: "/payroll", label: "វដ្តបៀវត្សរ៍", icon: Wallet },
    { href: "/payslips", label: "ប័ណ្ណបៀវត្សរ៍", icon: FileText },
    { href: "/calculator", label: "ម៉ាស៊ីនគិតលុយ", icon: Calculator },
    { href: "/attendance", label: "វត្តមាន & ច្បាប់", icon: CalendarDays },
  ]},
  { section: "របាយការណ៍", items: [
    { href: "/reports", label: "របាយការណ៍", icon: Printer },
    { href: "/forms", label: "ទម្រង់ផ្លូវការ", icon: Library },
    { href: "/compliance", label: "ច្បាប់ & ពន្ធ", icon: BookOpen },
  ]},
  { section: "រដ្ឋបាល", items: [
    { href: "/organization", label: "រចនាសម្ព័ន្ធ", icon: Building2 },
    { href: "/settings", label: "ការកំណត់", icon: Settings },
  ]},
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { settings, employees, activeRun } = useStore();

  // print / pdf views are full-bleed: no chrome
  const isDocumentView =
    pathname?.startsWith("/print") ||
    pathname?.startsWith("/reports/") ||
    pathname === "/payslips/batch";

  if (isDocumentView) {
    return <div className="min-h-screen bg-ink-100">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* ---------------- Sidebar ---------------- */}
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-40 flex flex-col border-r border-ink-800 bg-ink-950 text-ink-100 transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          collapsed ? "w-[72px]" : "w-[248px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-ink-800/80 px-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 text-[13px] font-bold text-ink-950 shadow-inner">
            ៛
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold tracking-tight text-white">
                KhmerPayroll
              </p>
              <p className="truncate text-[10px] text-ink-400">ប្រព័ន្ធបៀវត្សរ៍កម្ពុជា</p>
            </div>
          )}
          <button
            className="ml-auto hidden rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white lg:block"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="បង្រួម"
          >
            <ChevronLeft
              size={16}
              className={cn("transition-transform", collapsed && "rotate-180")}
            />
          </button>
          <button
            className="ml-auto rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* company chip */}
        {!collapsed && (
          <div className="mx-3 mt-3 rounded-xl bg-ink-900/80 p-2.5 ring-1 ring-ink-800">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-ink-700 text-[10px] font-bold text-gold-200">
                {settings.company.logoText}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-ink-100">
                  {settings.company.nameKh}
                </p>
                <p className="truncate text-[9px] text-ink-500">
                  {settings.company.taxId}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* nav */}
        <nav className="mt-3 flex-1 overflow-y-auto px-2 pb-3">
          {NAV.map((group) => (
            <div key={group.section} className="mb-3">
              {!collapsed && (
                <p className="mb-1 px-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-600">
                  {group.section}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                          active
                            ? "bg-ink-800 text-white shadow-sm"
                            : "text-ink-300 hover:bg-ink-900 hover:text-white"
                        )}
                      >
                        <Icon
                          size={17}
                          className={cn(
                            "shrink-0",
                            active ? "text-gold-300" : "text-ink-500 group-hover:text-ink-200"
                          )}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-300" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* footer */}
        <div className="border-t border-ink-800/80 p-2.5">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg p-1.5",
              !collapsed && "hover:bg-ink-900"
            )}
          >
            <Avatar name={settings.company.nameKh} size={30} className="!bg-gold-600" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-ink-100">
                  {settings.company.accountantNameKh}
                </p>
                <p className="truncate text-[9px] text-ink-500">គណនេយ្យករ</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ---------------- Main ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <button
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="ម៉ឺនុយ"
          >
            <Menu size={18} />
          </button>

          <div className="hidden min-w-0 sm:block">
            <p className="text-[11px] font-medium text-ink-400">ប្រព័ន្ធគ្រប់គ្រងបៀវត្សរ៍</p>
            <p className="truncate text-[13px] font-semibold text-ink-800">
              {settings.company.nameKh}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {/* period chip */}
            <Link
              href="/payroll"
              className="hidden items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5 text-[11px] font-semibold text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100 sm:flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {activeRun ? `${activeRun.code}` : "គ្មានវដ្ត"}
            </Link>

            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-ink-400 ring-1 ring-ink-200 hover:bg-ink-50"
            >
              <Search size={14} />
              <span className="hidden sm:inline">ស្វែងរក</span>
              <kbd className="hidden rounded border border-ink-200 bg-ink-50 px-1 text-[10px] text-ink-400 sm:inline">
                /
              </kbd>
            </button>

            <button
              className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100"
              title="ការជូនដំណឹង"
            >
              <Bell size={17} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>

            <Link
              href="/settings"
              className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"
              title="ការកំណត់"
            >
              <Settings size={17} />
            </Link>

            <div className="ml-1 hidden items-center gap-2 rounded-full bg-ink-50 py-1 pl-1 pr-3 ring-1 ring-ink-200 sm:flex">
              <Avatar name={settings.company.accountantNameKh} size={26} />
              <span className="text-[11px] font-semibold text-ink-700">
                {settings.company.accountantNameKh.split(" ").slice(-1).join(" ")}
              </span>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>

        <footer className="no-print border-t border-ink-200 px-6 py-3 text-[11px] text-ink-400">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              KhmerPayroll v1.0 · គណនាតាមច្បាប់ការងារ និងប្រកាសសារពើពន្ធកម្ពុជា
            </p>
            <p className="flex items-center gap-1.5">
              <BadgeCheck size={12} className="text-emerald-500" />
              NSSF ៛{settings.nssfCeiling.toLocaleString()} ceiling · ToS 0–20%
            </p>
          </div>
        </footer>
      </div>

      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        employees={employees}
      />
    </div>
  );
}

function CommandPalette({
  open,
  onClose,
  employees,
}: {
  open: boolean;
  onClose: () => void;
  employees: { id: string; lastNameKh: string; firstNameKh: string; code: string }[];
}) {
  const [q, setQ] = useState("");
  const pathname = usePathname();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "/" && !open) {
        const t = e.target as HTMLElement;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
        e.preventDefault();
        // open via parent state is handled by the caller
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const routes = NAV.flatMap((g) => g.items);
  const filteredRoutes = routes.filter((r) =>
    r.label.toLowerCase().includes(q.toLowerCase()) || r.href.includes(q)
  );
  const filteredEmps = employees
    .filter(
      (e) =>
        `${e.lastNameKh} ${e.firstNameKh} ${e.code}`
          .toLowerCase()
          .includes(q.toLowerCase())
    )
    .slice(0, 6);

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-pop">
        <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
          <Search size={16} className="text-ink-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ស្វែងរកទំព័រ ឬបុគ្គលិក…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-300"
          />
          <kbd className="rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] text-ink-400">
            ESC
          </kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {filteredRoutes.length > 0 && (
            <>
              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                ទំព័រ
              </p>
              {filteredRoutes.map((r) => {
                const Icon = r.icon;
                return (
                  <Link
                    key={r.href}
                    href={r.href}
                    onClick={onClose}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <Icon size={15} className="text-ink-400" />
                    {r.label}
                  </Link>
                );
              })}
            </>
          )}
          {filteredEmps.length > 0 && (
            <>
              <p className="mt-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                បុគ្គលិក
              </p>
              {filteredEmps.map((e) => (
                <Link
                  key={e.id}
                  href={`/employees/${e.id}`}
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-50"
                >
                  <Avatar name={e.firstNameKh} size={22} />
                  <span>
                    {e.lastNameKh} {e.firstNameKh}
                  </span>
                  <span className="ml-auto text-[10px] text-ink-400">{e.code}</span>
                </Link>
              ))}
            </>
          )}
          {filteredRoutes.length === 0 && filteredEmps.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-ink-400">រកមិនឃើញលទ្ធផល</p>
          )}
        </div>
      </div>
    </div>
  );
}
