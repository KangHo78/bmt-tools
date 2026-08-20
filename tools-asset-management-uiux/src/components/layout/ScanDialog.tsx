"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, X, KeyboardIcon, Loader2 } from "lucide-react";

export function ScanButton({ variant = "icon" }: { variant?: "icon" | "full" }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "notfound">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setStatus("idle");
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function submitCode(value: string) {
    if (!value.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/scan?code=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      if (data.found) {
        setOpen(false);
        setCode("");
        router.push(data.href);
      } else {
        setStatus("notfound");
      }
    } catch {
      setStatus("notfound");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Buka pemindai"
        className={
          variant === "icon"
            ? "tap-target inline-flex items-center justify-center gap-2 rounded border border-ink bg-amber px-3 py-2 text-sm font-bold text-amber-ink transition-colors hover:bg-amber/85"
            : "tap-target flex flex-col items-center justify-center gap-0.5 rounded-full bg-amber p-4 text-amber-ink shadow-[0_6px_16px_rgba(242,169,0,0.45)] -translate-y-4 border-2 border-ink"
        }
      >
        <ScanLine size={variant === "icon" ? 16 : 24} strokeWidth={2.25} />
        {variant === "icon" && <span className="hidden sm:inline">Scan</span>}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pindai kode aset atau transaksi"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 px-4 pb-4 sm:items-center sm:pb-0"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-panel border border-line bg-surface p-5 shadow-xl transition-transform duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Pindai Kode</h2>
              <button onClick={() => setOpen(false)} aria-label="Tutup" className="tap-target rounded p-1 text-muted hover:bg-canvas">
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 flex h-40 items-center justify-center rounded border-2 border-dashed border-line bg-canvas/70">
              <div className="text-center text-muted">
                <ScanLine size={36} className="mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-xs">Arahkan pemindai genggam atau kamera ke kode aset/transaksi</p>
              </div>
            </div>

            <form
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault();
                submitCode(code);
              }}
            >
              <label htmlFor="scan-code" className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <KeyboardIcon size={13} /> Input manual (fallback)
              </label>
              <div className="flex gap-2">
                <input
                  id="scan-code"
                  ref={inputRef}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setStatus("idle");
                  }}
                  placeholder="mis. TWL-DRL-2026-0002 atau TRX-1042"
                  className="tap-target w-full rounded border border-line bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-blue"
                />
                <button
                  type="submit"
                  className="tap-target shrink-0 rounded bg-ink px-4 text-sm font-semibold text-canvas hover:bg-ink/85"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Cari"}
                </button>
              </div>
              {status === "notfound" && (
                <p className="mt-2 text-xs font-medium text-red">
                  Kode tidak ditemukan. Periksa kembali kode aset atau nomor transaksi.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
