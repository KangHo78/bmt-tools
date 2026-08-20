"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SIDEBAR_ITEMS, type Role } from "@/lib/nav";
import { ChevronsLeft, ChevronsRight, Wrench } from "lucide-react";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const items = SIDEBAR_ITEMS.filter((i) => i.roles.includes(role));

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center gap-2 border-b border-line px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-ink text-canvas">
          <Wrench size={18} strokeWidth={2.25} />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-lg font-bold tracking-tight">TAMS</p>
            <p className="truncate text-[10px] uppercase tracking-[0.14em] text-muted">Tools Asset Mgmt</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Navigasi utama">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`tap-target flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-ink text-canvas" : "text-ink hover:bg-canvas"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="tap-target flex items-center justify-center gap-2 border-t border-line py-3 text-xs font-medium text-muted hover:bg-canvas"
        aria-label={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
      >
        {collapsed ? <ChevronsRight size={16} /> : (
          <>
            <ChevronsLeft size={16} /> Perkecil
          </>
        )}
      </button>
    </aside>
  );
}
