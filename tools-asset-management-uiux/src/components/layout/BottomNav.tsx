"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MOBILE_ITEMS, MORE_ITEMS, type Role } from "@/lib/nav";
import { ScanButton } from "./ScanDialog";
import { Grid2X2, X } from "lucide-react";

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = MOBILE_ITEMS[role];
  const moreItems = MORE_ITEMS[role];

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-ink/50 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="w-full rounded-t-panel border-t border-line bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Lainnya</h2>
              <button onClick={() => setMoreOpen(false)} aria-label="Tutup" className="tap-target rounded p-1 text-muted">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="tap-target flex flex-col items-center gap-1.5 rounded border border-line bg-canvas p-3 text-center text-xs font-medium"
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-surface px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navigasi mobile"
      >
        {items.map((item, idx) => {
          if (item.href === "/scan") {
            return <ScanButton key={item.href} variant="full" />;
          }
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`tap-target flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-ink" : "text-muted"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
        {moreItems.length > 0 && (
          <button onClick={() => setMoreOpen(true)} className="tap-target flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted">
            <Grid2X2 size={20} />
            Lainnya
          </button>
        )}
      </nav>
    </>
  );
}
