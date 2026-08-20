"use client";

import { useActionState, useState } from "react";
import { completeHandoverWithUnits, type HandoverState } from "@/lib/handover-actions";
import { PhotoCapture } from "@/components/ui/PhotoCapture";
import { AlertCircle, CheckCircle2, Loader2, ScanLine } from "lucide-react";

interface FlowItem {
  itemId: string;
  toolTypeId: string;
  toolName: string;
  checklist: string[];
  availableUnits: { id: string; assetCode: string }[];
}

const initialState: HandoverState = {};

export function HandoverFlow({ loanId, items }: { loanId: string; items: FlowItem[] }) {
  const [state, formAction, pending] = useActionState(completeHandoverWithUnits, initialState);
  const [unitCodes, setUnitCodes] = useState<Record<string, string>>({});
  const [matched, setMatched] = useState<Record<string, boolean | "error">>({});
  const [checklists, setChecklists] = useState<Record<string, Set<string>>>({});
  const [confirmStaff, setConfirmStaff] = useState(false);
  const [confirmBorrower, setConfirmBorrower] = useState(false);

  function setCode(itemId: string, toolTypeId: string, value: string) {
    setUnitCodes((c) => ({ ...c, [itemId]: value }));
    const item = items.find((i) => i.itemId === itemId);
    const found = item?.availableUnits.find((u) => u.assetCode.toLowerCase() === value.trim().toLowerCase());
    if (!value.trim()) {
      setMatched((m) => ({ ...m, [itemId]: false }));
    } else if (found) {
      setMatched((m) => ({ ...m, [itemId]: true }));
    } else {
      setMatched((m) => ({ ...m, [itemId]: "error" }));
    }
  }

  function toggleChecklist(itemId: string, key: string) {
    setChecklists((c) => {
      const next = new Set(c[itemId] ?? []);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...c, [itemId]: next };
    });
  }

  const allMatched = items.every((i) => matched[i.itemId] === true);

  return (
    <form action={formAction} className="mx-auto max-w-xl space-y-4 p-4 pb-32">
      <input type="hidden" name="loanId" value={loanId} />

      {items.map((item, idx) => (
        <div key={item.itemId} className="panel p-4">
          <input type="hidden" name="itemId" value={item.itemId} />
          <input type="hidden" name="unitCode" value={unitCodes[item.itemId] ?? ""} />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {idx + 1} dari {items.length} unit
          </p>
          <h2 className="font-display text-xl font-semibold text-ink">{item.toolName}</h2>

          <label className="mb-1 mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted">
            <ScanLine size={13} /> Pindai / masukkan kode unit
          </label>
          <input
            list={`units-${item.itemId}`}
            value={unitCodes[item.itemId] ?? ""}
            onChange={(e) => setCode(item.itemId, item.toolTypeId, e.target.value)}
            placeholder="mis. TWL-DRL-2026-0001"
            className="tap-target w-full rounded border border-line px-3 py-2.5 font-mono text-sm outline-none focus:border-blue"
          />
          <datalist id={`units-${item.itemId}`}>
            {item.availableUnits.map((u) => (
              <option key={u.id} value={u.assetCode} />
            ))}
          </datalist>

          {matched[item.itemId] === true && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-green">
              <CheckCircle2 size={13} /> Unit cocok dan tersedia.
            </p>
          )}
          {matched[item.itemId] === "error" && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red">
              <AlertCircle size={13} /> Kode tidak ditemukan pada unit tersedia untuk jenis alat ini. Periksa kembali kode.
            </p>
          )}

          <p className="mb-1.5 mt-4 text-xs font-semibold uppercase text-muted">Checklist kelengkapan</p>
          <div className="grid grid-cols-2 gap-2">
            {item.checklist.map((c) => (
              <label key={c} className="tap-target flex items-center gap-2 rounded border border-line p-2 text-sm">
                <input
                  type="checkbox"
                  name={`checklist_${item.itemId}`}
                  value={c}
                  checked={checklists[item.itemId]?.has(c) ?? false}
                  onChange={() => toggleChecklist(item.itemId, c)}
                  className="h-4 w-4"
                />
                {c}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="panel p-4">
        <p className="mb-2 text-xs font-semibold uppercase text-muted">Foto Kondisi Serah Terima</p>
        <PhotoCapture name="handoverPhoto" label="Foto" />
      </div>

      <div className="panel space-y-2 p-4">
        <p className="text-xs font-semibold uppercase text-muted">Konfirmasi Kedua Pihak</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={confirmStaff} onChange={(e) => setConfirmStaff(e.target.checked)} className="h-4 w-4" name="confirmStaff" value="1" />
          Petugas mengonfirmasi kondisi &amp; kelengkapan sesuai checklist
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmBorrower}
            onChange={(e) => setConfirmBorrower(e.target.checked)}
            className="h-4 w-4"
            name="confirmBorrower"
            value="1"
          />
          Peminjam mengonfirmasi menerima alat dalam kondisi tersebut
        </label>
      </div>

      {state.error && (
        <p role="alert" className="flex items-center gap-2 rounded border border-red/40 bg-red/10 px-3 py-2.5 text-sm font-medium text-red">
          <AlertCircle size={16} className="shrink-0" /> {state.error}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface p-3">
        <button
          type="submit"
          disabled={!allMatched || !confirmStaff || !confirmBorrower || pending}
          className="tap-target flex w-full items-center justify-center gap-2 rounded bg-amber py-3 text-sm font-bold text-amber-ink disabled:opacity-50"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          Selesaikan Serah Terima
        </button>
      </div>
    </form>
  );
}
