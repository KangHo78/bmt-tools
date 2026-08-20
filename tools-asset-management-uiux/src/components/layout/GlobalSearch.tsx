"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

interface SearchGroup {
  label: string;
  items: { id: string; title: string; subtitle?: string; href: string }[];
}

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const flatItems = groups.flatMap((g) => g.items);

  useEffect(() => {
    if (q.trim().length < 2) {
      setGroups([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setGroups(data.groups ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        e.preventDefault();
        go(flatItems[activeIndex].href);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded border border-line bg-surface px-3 py-2 focus-within:border-blue">
        <Search size={16} className="shrink-0 text-muted" aria-hidden />
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls="global-search-listbox"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Cari alat, kode aset, transaksi, peminjam, lokasi..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {loading && <Loader2 size={14} className="animate-spin text-muted" aria-hidden />}
      </div>

      {open && groups.length > 0 && (
        <div
          id="global-search-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-96 overflow-y-auto rounded border border-line bg-surface shadow-lg"
        >
          {groups.map((group) => (
            <div key={group.label} className="border-b border-line last:border-b-0">
              <p className="bg-canvas px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{group.label}</p>
              {group.items.map((item) => {
                const idx = flatItems.findIndex((f) => f.id === item.id && f.href === item.href);
                return (
                  <button
                    key={item.href + item.id}
                    role="option"
                    aria-selected={idx === activeIndex}
                    onClick={() => go(item.href)}
                    className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-canvas ${idx === activeIndex ? "bg-canvas" : ""}`}
                  >
                    <span className="font-medium text-ink">{item.title}</span>
                    {item.subtitle && <span className="text-xs text-muted">{item.subtitle}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {open && groups.length === 0 && q.trim().length >= 2 && !loading && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded border border-line bg-surface p-3 text-sm text-muted shadow-lg">
          Tidak ditemukan hasil untuk &ldquo;{q}&rdquo;.
        </div>
      )}
    </div>
  );
}
