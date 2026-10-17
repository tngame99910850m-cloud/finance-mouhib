"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Shirt, Sparkles, Heart, Settings, User } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/studio", label: "Studio", icon: Sparkles },
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/avatar", label: "Avatar", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

// The studio is the primary surface and manages its own full-bleed 3D
// layout, so it opts out of the shared chrome — the shell would otherwise
// eat into the 3D viewport's height and compete with its own bottom sheet.
const FULLSCREEN_ROUTES = ["/studio"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

  if (isFullscreen) {
    return <div className="h-dvh w-full overflow-hidden">{children}</div>;
  }

  return (
    <div className="flex min-h-dvh w-full flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-surface md:px-3 md:py-6">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">Her Style</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted hover:bg-surface-muted hover:text-foreground"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border pt-4">
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="safe-top flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">Her Style</span>
        <ThemeToggle />
      </header>

      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-surface/95 backdrop-blur md:hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
