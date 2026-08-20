"use client";

import { useActionState, useMemo, useState } from "react";
import { submitLoanRequest, type SubmitLoanState } from "../actions";
import { DocumentUploader } from "@/components/ui/DocumentUploader";
import { Minus, Plus, Check, ChevronRight, ChevronLeft, AlertCircle, Loader2 } from "lucide-react";

interface ToolTypeOption {
  id: string;
  name: string;
  code: string;
  available: number;
  requiresOutsideLetter: boolean;
}

const initialState: SubmitLoanState = {};

export function LoanStepper({
  toolTypes,
  tokenAvailable,
  preselectId,
}: {
  toolTypes: ToolTypeOption[];
  tokenAvailable: number;
  preselectId?: string;
}) {
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<Record<string, number>>(preselectId ? { [preselectId]: 1 } : {});
  const [usageType, setUsageType] = useState<"dalam_area" | "luar_area">("dalam_area");
  const [purpose, setPurpose] = useState("");
  const [locationText, setLocationText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [state, formAction, pending] = useActionState(submitLoanRequest, initialState);

  const cartTypes = Object.entries(cart).filter(([, qty]) => qty > 0);
  const tokensNeeded = cartTypes.length;
  const needsOutsideLetter = usageType === "luar_area" && cartTypes.some(([id]) => toolTypes.find((t) => t.id === id)?.requiresOutsideLetter);

  const stepErrors = useMemo(() => {
    const errs: Record<number, string | null> = { 1: null, 2: null, 3: null };
    if (cartTypes.length === 0) errs[1] = "Pilih minimal satu jenis alat.";
    else if (tokensNeeded > tokenAvailable) errs[1] = `Token tidak cukup. Butuh ${tokensNeeded}, tersisa ${tokenAvailable}.`;
    if (!purpose.trim() || !locationText.trim() || !startDate || !dueDate) errs[3] = "Lengkapi tujuan, lokasi, dan tanggal.";
    return errs;
  }, [cartTypes.length, tokensNeeded, tokenAvailable, purpose, locationText, startDate, dueDate]);

  const steps = ["Pilih Alat", "Jenis Penggunaan", "Isi Detail", "Tinjau"];

  function next() {
    setStep((s) => Math.min(4, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  const canReview = !stepErrors[1] && !stepErrors[3] && (usageType === "dalam_area" || !needsOutsideLetter || true);

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap gap-2">
        {steps.map((label, idx) => {
          const n = idx + 1;
          const active = step === n;
          const done = step > n;
          return (
            <li
              key={label}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                active ? "border-ink bg-ink text-canvas" : done ? "border-green/40 bg-green/10 text-green" : "border-line bg-surface text-muted"
              }`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">{done ? <Check size={11} /> : n}</span>
              {label}
            </li>
          );
        })}
      </ol>

      <form action={formAction} className="panel p-5">
        {cartTypes.map(([id, qty]) =>
          Array.from({ length: qty }).map((_, i) => <input key={`${id}-${i}`} type="hidden" name="toolTypeId" value={id} />)
        )}
        <input type="hidden" name="usageType" value={usageType} />
        <input type="hidden" name="purpose" value={purpose} />
        <input type="hidden" name="locationText" value={locationText} />
        <input type="hidden" name="startDate" value={startDate} />
        <input type="hidden" name="dueDate" value={dueDate} />
        <input type="hidden" name="agreement" value={agreement ? "1" : ""} />

        {step === 1 && (
          <div>
            <h2 className="font-display text-xl font-semibold">1. Pilih Alat</h2>
            <p className="mt-1 text-sm text-muted">Keranjang dikelompokkan per jenis alat. Setiap jenis yang dipilih memakai 1 token.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {toolTypes.map((t) => {
                const qty = cart[t.id] ?? 0;
                return (
                  <div key={t.id} className={`flex items-center justify-between gap-2 rounded border p-3 ${qty > 0 ? "border-ink" : "border-line"}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{t.name}</p>
                      <p className="font-num text-xs text-muted">
                        {t.code} · {t.available} tersedia
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        disabled={qty === 0}
                        onClick={() => setCart((c) => ({ ...c, [t.id]: Math.max(0, (c[t.id] ?? 0) - 1) }))}
                        className="tap-target flex h-8 w-8 items-center justify-center rounded border border-line disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-num w-4 text-center text-sm font-semibold">{qty}</span>
                      <button
                        type="button"
                        disabled={qty >= t.available}
                        onClick={() => setCart((c) => ({ ...c, [t.id]: Math.min(t.available, (c[t.id] ?? 0) + 1) }))}
                        className="tap-target flex h-8 w-8 items-center justify-center rounded border border-line disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded border border-line bg-canvas p-3 text-sm">
              <span className="font-semibold text-ink">{tokensNeeded} token</span> akan digunakan dari{" "}
              <span className="font-semibold text-ink">{tokenAvailable} token tersisa</span>.
            </div>
            {stepErrors[1] && (
              <p className="mt-2 flex items-center gap-1 text-sm font-medium text-red">
                <AlertCircle size={14} /> {stepErrors[1]}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-xl font-semibold">2. Pilih Penggunaan</h2>
            <p className="mt-1 text-sm text-muted">Tentukan area penggunaan alat untuk menentukan dokumen yang diperlukan.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setUsageType("dalam_area")}
                className={`tap-target rounded border p-4 text-left ${usageType === "dalam_area" ? "border-ink bg-ink/5" : "border-line"}`}
              >
                <p className="font-semibold text-ink">Dalam Area</p>
                <p className="mt-1 text-xs text-muted">Digunakan di lingkungan fasilitas sendiri. Tidak memerlukan surat tugas.</p>
              </button>
              <button
                type="button"
                onClick={() => setUsageType("luar_area")}
                className={`tap-target rounded border p-4 text-left ${usageType === "luar_area" ? "border-ink bg-ink/5" : "border-line"}`}
              >
                <p className="font-semibold text-ink">Luar Area</p>
                <p className="mt-1 text-xs text-muted">Dibawa keluar fasilitas. Memerlukan surat tugas dan persetujuan Kepala Logistik.</p>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">3. Isi Detail</h2>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Tujuan Penggunaan</label>
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="mis. Pemasangan rak gudang B"
                className="tap-target w-full rounded border border-line px-3 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Lokasi Penggunaan</label>
              <input
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="mis. Gudang B - Lantai 2"
                className="tap-target w-full rounded border border-line px-3 py-2.5 text-sm outline-none focus:border-blue"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="tap-target w-full rounded border border-line px-3 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Tanggal Tenggat</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="tap-target w-full rounded border border-line px-3 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>
            </div>
            {usageType === "luar_area" && <DocumentUploader name="letterUrl" label="Surat Tugas Luar Area" required />}
            {stepErrors[3] && (
              <p className="flex items-center gap-1 text-sm font-medium text-red">
                <AlertCircle size={14} /> {stepErrors[3]}
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">4. Tinjau &amp; Kirim</h2>
            <div className="rounded border border-line p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Alat yang diajukan</p>
              <ul className="mt-2 space-y-1 text-sm">
                {cartTypes.map(([id, qty]) => {
                  const t = toolTypes.find((x) => x.id === id);
                  return (
                    <li key={id} className="flex justify-between">
                      <span>{t?.name}</span>
                      <span className="font-num text-muted">{qty} unit</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-line p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Token digunakan</p>
                <p className="font-num mt-1 text-lg font-bold">
                  {tokensNeeded} dari {tokenAvailable} tersisa
                </p>
              </div>
              <div className="rounded border border-line p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tenggat</p>
                <p className="mt-1 font-semibold">{dueDate || "-"}</p>
              </div>
            </div>
            <div className="rounded border border-line p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Penggunaan &amp; Dokumen</p>
              <p className="mt-1">{usageType === "luar_area" ? "Luar Area" : "Dalam Area"} · {locationText || "-"}</p>
              <p className="text-muted">{purpose || "-"}</p>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={agreement} onChange={(e) => setAgreement(e.target.checked)} className="tap-target mt-0.5 h-4 w-4" />
              <span>
                Saya menyatakan bertanggung jawab penuh atas kondisi dan kelengkapan alat selama masa peminjaman, dan akan mengembalikan sesuai
                tenggat yang disepakati.
              </span>
            </label>
            {state.error && (
              <p role="alert" className="flex items-center gap-1 rounded border border-red/40 bg-red/10 px-3 py-2 text-sm font-medium text-red">
                <AlertCircle size={14} /> {state.error}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className="tap-target inline-flex items-center gap-1 rounded border border-line px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Kembali
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              disabled={Boolean(step === 1 && stepErrors[1])}
              className="tap-target inline-flex items-center gap-1 rounded bg-ink px-5 py-2.5 text-sm font-semibold text-canvas disabled:opacity-50"
            >
              Lanjut <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!agreement || pending || !canReview}
              title={!agreement ? "Setujui pernyataan tanggung jawab terlebih dahulu" : undefined}
              className="tap-target inline-flex items-center gap-2 rounded bg-amber px-5 py-2.5 text-sm font-bold text-amber-ink disabled:opacity-50"
            >
              {pending && <Loader2 size={16} className="animate-spin" />}
              Kirim Permohonan
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
