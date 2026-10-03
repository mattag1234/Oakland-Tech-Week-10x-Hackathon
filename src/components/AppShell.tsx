"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bot,
  Building2,
  GitBranch,
  LayoutDashboard,
  Link2,
  ListChecks,
  Shield,
  Users,
} from "lucide-react";
import { ROLE_LABELS, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Button, Select } from "./ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/placement", label: "Placement Requests", icon: ListChecks },
  { href: "/providers", label: "Provider Options", icon: Building2 },
  { href: "/referrals", label: "Referral Tracking", icon: GitBranch },
  { href: "/provider-portal", label: "Provider Portal", icon: Users },
  { href: "/agents", label: "Agent Control Center", icon: Bot },
  { href: "/insights", label: "County Insights", icon: Activity },
  { href: "/connections", label: "Data Connections", icon: Link2 },
  { href: "/safety", label: "Safety and Governance", icon: Shield },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, setRole, loadDemoScenario, resetDemo, hydrated } = useStore();

  const onDemo = () => {
    loadDemoScenario();
    router.push("/placement?demo=1");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-navy-900">
      <div className="border-b border-amber-300/80 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 sm:text-sm">
        Prototype using synthetic data — not connected to live County systems.
      </div>

      <header className="border-b border-slate-200 bg-navy-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
              <GitBranch className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold leading-tight tracking-tight">
                Solace Relay
              </span>
              <span className="block text-xs text-slate-300">
                From a request for help to a confirmed next step.
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="role-switcher">
              Role
            </label>
            <Select
              id="role-switcher"
              className="h-9 min-w-[12rem] border-navy-700 bg-navy-800 text-white"
              value={state.role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
            <Button variant="confirm" size="sm" onClick={onDemo}>
              Load demo scenario
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="border-navy-600 bg-navy-800 text-white hover:bg-navy-700"
              onClick={resetDemo}
            >
              Reset data
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-0 lg:gap-6">
        <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white/70 lg:block">
          <nav className="sticky top-0 space-y-1 p-3" aria-label="Main">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-navy-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <nav
            className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white/80 px-2 py-2 lg:hidden"
            aria-label="Mobile"
          >
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium",
                    active
                      ? "bg-navy-900 text-white"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="px-4 py-6 sm:px-6">
            {!hydrated ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
                Loading workspace…
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
