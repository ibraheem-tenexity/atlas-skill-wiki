"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Plus,
  Building2,
  ShieldCheck,
  Network,
  Layers,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Catalog", icon: BookOpen },
  { href: "/skill/new", label: "New Skill", icon: Plus },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/governance", label: "Governance", icon: ShieldCheck },
  { href: "/graph", label: "Graph", icon: Network },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-60 shrink-0 border-r border-sidebar-border bg-sidebar h-full"
      aria-label="Primary navigation"
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-md bg-brand text-brand-foreground"
          aria-hidden="true"
        >
          <Layers className="w-4 h-4" />
        </div>
        <span className="text-heading-sm font-semibold text-sidebar-foreground tracking-tight">
          Atlas
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5" aria-label="App sections">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/" || pathname === "/catalog"
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-md text-body-md font-medium transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:shadow-focus",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={[
                  "w-4 h-4 shrink-0",
                  isActive ? "text-brand" : "text-muted-foreground",
                ].join(" ")}
                aria-hidden="true"
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-caption text-muted-foreground">Tenexity Atlas v0.1</p>
      </div>
    </aside>
  );
}
