import { Head, Link, router } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowLeft,
    Camera,
    Check,
    ClipboardCheck,
    ExternalLink,
    FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Panel } from "@/Components/TamsUI";
import type { Loan } from "@/types/tams";

type Inspection = {
    status: string;
    note: string;
    photo: File | null;
    checklist: Record<string, boolean>;
};
export default function ReturnFlow({ loan }: { loan: Loan }) {
    const [current, setCurrent] = useState(0);
    const [values, setValues] = useState<Record<number, Inspection>>(
        Object.fromEntries(
            loan.items.map((i) => [
                i.id,
                {
                    status: "",
                    note: "",
                    photo: null,
                    checklist: Object.fromEntries(
                        (i.tool_type.checklist ?? []).map((label) => [
                            label,
                            true,
                        ]),
                    ),
                },
            ]),
        ),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const item = loan.items[current];
    const update = (patch: Partial<Inspection>) =>
        setValues({ ...values, [item.id]: { ...values[item.id], ...patch } });
    const complete = Object.values(values).filter(
        (v) => v.status && v.photo,
    ).length;
    const submit = () => {
        const fd = new FormData();
        Object.entries(values).forEach(([id, v]) => {
            fd.append(`inspections[${id}][status]`, v.status);
            fd.append(`inspections[${id}][note]`, v.note);
            Object.entries(v.checklist).forEach(([label, checked]) =>
                fd.append(
                    `inspections[${id}][checklist][${label}]`,
                    checked ? "1" : "0",
                ),
            );
            if (v.photo) fd.append(`inspections[${id}][photo]`, v.photo);
        });
        setProcessing(true);
        router.post(`/pengembalian/${loan.id}`, fd, {
            forceFormData: true,
            onError: (e: any) => setErrors(e),
            onFinish: () => setProcessing(false),
        });
    };
    return (
        <div className="min-h-screen bg-canvas bg-grid">
            <Head title={`Pengembalian ${loan.trx_no}`} />
            <header className="flex h-16 items-center justify-between border-b bg-ink px-4 text-white sm:px-8">
                <Link
                    href={`/peminjaman/${loan.id}`}
                    className="flex items-center gap-2 text-sm font-semibold"
                >
                    <ArrowLeft size={17} />
                    Batal
                </Link>
                <div className="text-center">
                    <p className="font-num text-xs text-amber">{loan.trx_no}</p>
                    <p className="font-display text-lg font-bold">
                        INSPEKSI KEMBALI
                    </p>
                </div>
                <span className="font-num text-xs">
                    {complete}/{loan.items.length}
                </span>
            </header>
            <main className="mx-auto max-w-4xl p-4 py-8 sm:p-8">
                <div className="mb-5 h-2 overflow-hidden rounded bg-line">
                    <div
                        className="h-full bg-green transition-all"
                        style={{
                            width: `${(complete / loan.items.length) * 100}%`,
                        }}
                    />
                </div>
                <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
                    <Panel className="h-fit overflow-hidden">
                        <div className="border-b p-4">
                            <p className="label">Daftar Unit</p>
                            <h2 className="font-display text-xl font-bold">
                                Pemeriksaan
                            </h2>
                        </div>
                        {loan.items.map((row, i) => (
                            <button
                                key={row.id}
                                onClick={() => setCurrent(i)}
                                className={`flex w-full items-center gap-3 border-b p-3 text-left last:border-0 ${i === current ? "bg-amber/15" : "hover:bg-canvas"}`}
                            >
                                <span
                                    className={`grid size-7 place-items-center rounded text-xs font-bold ${values[row.id].status && values[row.id].photo ? "bg-green text-white" : "bg-line text-muted"}`}
                                >
                                    {values[row.id].status &&
                                    values[row.id].photo ? (
                                        <Check size={14} />
                                    ) : (
                                        i + 1
                                    )}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                        {row.tool_type.name}
                                    </p>
                                    <p className="truncate font-num text-[9px] text-muted">
                                        {row.unit?.asset_code}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </Panel>
                    <Panel className="overflow-hidden">
                        <div className="hazard-stripe h-2" />
                        <div className="p-5">
                            <p className="font-num text-xs font-bold text-green">
                                UNIT {current + 1} / {loan.items.length}
                            </p>
                            <h1 className="mt-1 font-display text-3xl font-bold">
                                {item.tool_type.name}
                            </h1>
                            <p className="font-num text-xs text-muted">
                                {item.unit?.asset_code}
                            </p>
                            <EvidenceComparison
                                beforeUrls={item.handover_evidence_urls ?? []}
                                afterFile={values[item.id].photo}
                                setAfterFile={(photo) => update({ photo })}
                            />
                            <div className="mt-6">
                                <p className="label">Kondisi hasil inspeksi</p>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {[
                                        ["sesuai", "Sesuai"],
                                        ["rusak", "Rusak"],
                                        ["tidak_lengkap", "Tidak Lengkap"],
                                        ["hilang", "Hilang"],
                                    ].map(([status, label]) => (
                                        <button
                                            key={status}
                                            onClick={() => update({ status })}
                                            className={`min-h-14 rounded-md border px-2 text-xs font-bold ${values[item.id].status === status ? (status === "sesuai" ? "border-green bg-green text-white" : "border-red bg-red text-white") : "bg-white hover:border-ink"}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-5">
                                <p className="label">Checklist kelengkapan</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {item.tool_type.checklist?.map((x) => (
                                        <label
                                            key={x}
                                            className="flex items-center gap-3 rounded border bg-canvas/50 p-3 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    values[item.id].checklist[x]
                                                }
                                                onChange={(event) =>
                                                    update({
                                                        checklist: {
                                                            ...values[item.id]
                                                                .checklist,
                                                            [x]: event.target
                                                                .checked,
                                                        },
                                                        status:
                                                            !event.target
                                                                .checked &&
                                                            values[item.id]
                                                                .status ===
                                                                "sesuai"
                                                                ? "tidak_lengkap"
                                                                : values[
                                                                      item.id
                                                                  ].status,
                                                    })
                                                }
                                                className="size-5 accent-green"
                                            />
                                            {x}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <label className="mt-5 block">
                                <span className="label">Catatan inspeksi</span>
                                <textarea
                                    value={values[item.id].note}
                                    onChange={(e) =>
                                        update({ note: e.target.value })
                                    }
                                    className="control min-h-24"
                                    placeholder="Wajib dijelaskan jika rusak, tidak lengkap, atau hilang..."
                                />
                            </label>
                            {Object.keys(errors).some((k) =>
                                k.includes(String(item.id)),
                            ) && (
                                <p className="mt-3 text-sm text-red">
                                    Lengkapi status dan foto unit ini.
                                </p>
                            )}
                            <div className="mt-6 flex justify-between border-t pt-5">
                                <button
                                    disabled={current === 0}
                                    onClick={() => setCurrent(current - 1)}
                                    className="btn-secondary"
                                >
                                    <ArrowLeft size={17} />
                                    Sebelumnya
                                </button>
                                {current < loan.items.length - 1 ? (
                                    <button
                                        disabled={
                                            !values[item.id].status ||
                                            !values[item.id].photo
                                        }
                                        onClick={() => setCurrent(current + 1)}
                                        className="btn-primary"
                                    >
                                        Unit Berikutnya
                                    </button>
                                ) : (
                                    <button
                                        disabled={
                                            processing ||
                                            complete !== loan.items.length
                                        }
                                        onClick={submit}
                                        className="btn-primary"
                                    >
                                        <ClipboardCheck size={17} />
                                        {processing
                                            ? "Menyimpan..."
                                            : "Selesaikan Pengembalian"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </Panel>
                </div>
                {Object.values(values).some((v) =>
                    ["rusak", "hilang"].includes(v.status),
                ) && (
                    <div className="mt-5 flex gap-3 rounded-lg border border-red/30 bg-red/10 p-4 text-sm text-red">
                        <AlertTriangle className="shrink-0" />
                        <p>
                            Temuan rusak atau hilang akan otomatis membuka kasus
                            pertanggungjawaban. Berita Acara wajib dilengkapi
                            setelah inspeksi.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

function EvidenceComparison({
    beforeUrls,
    afterFile,
    setAfterFile,
}: {
    beforeUrls: string[];
    afterFile: File | null;
    setAfterFile: (file: File | null) => void;
}) {
    return (
        <section className="mt-5 overflow-hidden rounded-lg border border-line bg-canvas/50">
            <div className="flex items-center justify-between border-b border-line bg-ink px-4 py-3 text-white">
                <div>
                    <p className="font-num text-[10px] font-bold uppercase tracking-[.16em] text-amber">
                        Condition evidence
                    </p>
                    <h2 className="font-display text-lg font-bold">
                        Perbandingan Sebelum & Sesudah
                    </h2>
                </div>
                <span className="rounded border border-white/20 px-2 py-1 font-num text-[10px] text-white/65">
                    PER ITEM
                </span>
            </div>
            <div className="grid md:grid-cols-2">
                <div className="border-b border-line p-4 md:border-b-0 md:border-r">
                    <p className="label mb-2">Sebelum · Serah Terima</p>
                    <StoredEvidence urls={beforeUrls} />
                </div>
                <div className="p-4">
                    <p className="label mb-2">Sesudah · Pengembalian</p>
                    <ReturnEvidencePicker
                        file={afterFile}
                        setFile={setAfterFile}
                    />
                </div>
            </div>
        </section>
    );
}

function StoredEvidence({ urls }: { urls: string[] }) {
    if (!urls.length) {
        return (
            <div className="grid min-h-40 place-items-center rounded-md border border-dashed border-line bg-surface p-4 text-center text-xs text-muted">
                Bukti serah terima belum tersedia untuk item ini.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {urls.map((url) =>
                isPdf(url) ? (
                    <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-40 items-center justify-center gap-3 rounded-md border border-red/20 bg-surface p-4 text-red hover:border-red"
                    >
                        <FileText size={30} />
                        <span>
                            <strong className="block text-sm">
                                Dokumen PDF
                            </strong>
                            <small className="mt-1 flex items-center gap-1 text-muted">
                                Buka bukti <ExternalLink size={12} />
                            </small>
                        </span>
                    </a>
                ) : (
                    <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-md border border-line bg-surface"
                    >
                        <img
                            src={url}
                            alt="Bukti kondisi saat serah terima"
                            className="h-40 w-full object-contain"
                        />
                    </a>
                ),
            )}
        </div>
    );
}

function ReturnEvidencePicker({
    file,
    setFile,
}: {
    file: File | null;
    setFile: (file: File | null) => void;
}) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <label
            className={`relative grid min-h-40 cursor-pointer place-items-center overflow-hidden rounded-md border-2 border-dashed text-center ${file ? "border-green bg-green/5" : "border-line bg-surface hover:border-ink"}`}
        >
            {previewUrl && file?.type.startsWith("image/") ? (
                <img
                    src={previewUrl}
                    alt="Pratinjau kondisi saat pengembalian"
                    className="absolute inset-0 size-full object-contain"
                />
            ) : (
                <span className="relative p-4">
                    <Camera className="mx-auto text-muted" />
                    <span className="mt-2 block text-sm font-semibold">
                        Foto kondisi pengembalian
                    </span>
                    <span className="mt-1 block font-num text-xs text-muted">
                        {file?.name ?? "Ambil foto atau pilih dari galeri"}
                    </span>
                </span>
            )}
            {file && (
                <span className="absolute bottom-2 right-2 rounded bg-ink px-2 py-1 font-num text-[10px] text-white shadow">
                    Ganti foto
                </span>
            )}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
        </label>
    );
}

function isPdf(url: string) {
    return /\.pdf(?:$|[?#])/i.test(url);
}
