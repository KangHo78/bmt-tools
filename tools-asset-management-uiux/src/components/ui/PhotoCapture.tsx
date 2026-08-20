"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2, ImageOff } from "lucide-react";
import Image from "next/image";

export interface CapturedPhoto {
  url: string;
  caption?: string;
}

export function PhotoCapture({
  name,
  label = "Ambil Foto",
  onChange,
  initial = [],
}: {
  name: string;
  label?: string;
  onChange?: (photos: CapturedPhoto[]) => void;
  initial?: CapturedPhoto[];
}) {
  const [photos, setPhotos] = useState<CapturedPhoto[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function update(next: CapturedPhoto[]) {
    setPhotos(next);
    onChange?.(next);
  }

  async function handleFiles(files: FileList) {
    setUploading(true);
    setError("");
    try {
      const uploaded: CapturedPhoto[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah foto.");
        uploaded.push({ url: data.url });
      }
      update([...photos, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah foto. Periksa koneksi dan coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(photos)} />
      <div className="flex flex-wrap gap-2">
        {photos.map((p, idx) => (
          <div key={p.url + idx} className="group relative h-20 w-20 overflow-hidden rounded border border-line bg-canvas">
            <Image src={p.url} alt={`Foto ${idx + 1}`} fill sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => update(photos.filter((_, i) => i !== idx))}
              className="tap-target absolute inset-0 flex items-center justify-center bg-ink/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Hapus foto"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="tap-target flex h-20 w-20 flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-line text-muted hover:border-blue disabled:opacity-60"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red">
          <ImageOff size={13} /> {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
