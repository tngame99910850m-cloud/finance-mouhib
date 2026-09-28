"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { resetStore } from "@/lib/local-store";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PieChart,
  PiggyBank,
  Plane,
  TrendingUp,
  FileBarChart,
  Settings,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: Wallet },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budget", label: "Budget", icon: PieChart },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/vacation", label: "Vacation", icon: Plane },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted hover:bg-surface-muted hover:text-foreground"
            )}
          >
            <Icon size={17} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function ResetButton({ className }: { className?: string }) {
  const router = useRouter();
  function handleReset() {
    if (!window.confirm("Erase all data stored in this browser and start over? This cannot be undone.")) return;
    resetStore();
    router.push("/setup");
    router.refresh();
  }
  return (
    <button
      onClick={handleReset}
      className={cn("inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-danger/10 hover:text-danger", className)}
    >
      <Trash2 size={16} /> Reset data
    </button>
  );
}

export function SidebarNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-surface md:px-3 md:py-5">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            ر.ق
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Mouhib Finance</p>
            <p className="text-xs text-muted leading-tight">Qatar · QAR</p>
          </div>
        </div>
        <NavLinks />
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4 px-1">
          <ThemeToggle />
          <ResetButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            ر.ق
          </div>
          <span className="text-sm font-semibold text-foreground">Mouhib Finance</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex w-64 flex-col bg-surface px-3 py-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-foreground">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <NavLinks onClick={() => setOpen(false)} />
            <ResetButton className="mt-4 border-t border-border px-3 py-3" />
          </div>
        </div>
      )}
    </>
  );
}
