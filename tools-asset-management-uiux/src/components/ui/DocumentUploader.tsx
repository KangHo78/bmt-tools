"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, RotateCcw, Trash2, UploadCloud, AlertCircle } from "lucide-react";

interface UploadedFile {
  url: string;
  name: string;
  size: number;
}

export function DocumentUploader({
  name,
  label,
  hint = "PDF, JPG, atau PNG, maksimal 10MB",
  required = false,
  initial,
}: {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  initial?: UploadedFile | null;
}) {
  const [file, setFile] = useState<UploadedFile | null>(initial ?? null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(selected: File) {
    setStatus("uploading");
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah berkas.");
      setFile({ url: data.url, name: data.name, size: data.size });
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Gagal mengunggah berkas.");
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink">
        {label} {required && <span className="text-red">*</span>}
      </label>
      <input type="hidden" name={name} value={file?.url ?? ""} />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="tap-target flex w-full flex-col items-center gap-2 rounded border-2 border-dashed border-line bg-canvas/70 px-4 py-6 text-center text-sm text-muted transition-colors hover:border-blue"
          disabled={status === "uploading"}
        >
          {status === "uploading" ? <Loader2 size={22} className="animate-spin text-blue" /> : <UploadCloud size={22} />}
          <span>{status === "uploading" ? "Mengunggah..." : "Klik untuk unggah dokumen"}</span>
          <span className="text-xs">{hint}</span>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded border border-line bg-surface p-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText size={18} className="shrink-0 text-blue" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{file.name}</p>
              <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB · versi 1</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => inputRef.current?.click()} className="tap-target rounded p-1.5 text-muted hover:bg-canvas" aria-label="Ganti berkas">
              <RotateCcw size={16} />
            </button>
            <button type="button" onClick={() => setFile(null)} className="tap-target rounded p-1.5 text-red hover:bg-red/10" aria-label="Hapus berkas">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red">
          <AlertCircle size={13} /> {error} —
          <button type="button" onClick={() => inputRef.current?.click()} className="underline">
            coba lagi
          </button>
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) handleFile(selected);
          e.target.value = "";
        }}
      />
    </div>
  );
}
