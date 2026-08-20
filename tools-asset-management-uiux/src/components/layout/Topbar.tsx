"use client";

import Link from "next/link";
import { Bell, MapPin, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { GlobalSearch } from "./GlobalSearch";
import { ScanButton } from "./ScanDialog";
import { roleLabel } from "@/lib/status";
import type { Role } from "@/lib/nav";
import { logoutAction } from "@/app/(app)/actions";

export function Topbar({
  name,
  role,
  workLocation,
  unreadCount,
}: {
  name: string;
  role: Role;
  workLocation?: string;
  unreadCount: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4">
      <div className="hidden flex-1 sm:block">
        <GlobalSearch />
      </div>
      <Link href="/katalog" className="flex-1 sm:hidden">
        <p className="font-display text-lg font-bold">TAMS</p>
      </Link>

      <ScanButton />

      {workLocation && (
        <div className="hidden items-center gap-1.5 rounded border border-line px-2.5 py-1.5 text-xs font-medium text-muted md:flex">
          <MapPin size={13} /> {workLocation}
        </div>
      )}

      <Link
        href="/notifikasi"
        className="tap-target relative inline-flex items-center justify-center rounded border border-line p-2 text-ink hover:bg-canvas"
        aria-label="Notifikasi"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </Link>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="tap-target flex items-center gap-2 rounded border border-line px-2 py-1.5 hover:bg-canvas"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-canvas">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-sm font-semibold">{name}</span>
            <span className="block text-[11px] text-muted">{roleLabel[role]}</span>
          </span>
          <ChevronDown size={14} className="hidden md:block" />
        </button>
        {menuOpen && (
          <div role="menu" className="absolute right-0 top-full mt-1 w-48 rounded border border-line bg-surface py-1 shadow-lg">
            <Link href="/akun" role="menuitem" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-canvas" onClick={() => setMenuOpen(false)}>
              <UserIcon size={15} /> Akun Saya
            </Link>
            <form action={logoutAction}>
              <button role="menuitem" type="submit" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red hover:bg-canvas">
                <LogOut size={15} /> Keluar
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
