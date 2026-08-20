import { Head, router } from "@inertiajs/react";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    FileText,
    MapPin,
    PackagePlus,
} from "lucide-react";
import { useMemo, useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import { AssetGlyph, PageHeader, Panel, TokenMeter } from "@/Components/TamsUI";
import type { ToolType } from "@/types/tams";

export default function Create({
    tools,
    token,
    preselected,
}: {
    tools: ToolType[];
    token: { used: number; total: number };
    preselected: number[];
}) {
    const [step, setStep] = useState(1);
    const [selected, setSelected] = useState<number[]>(preselected);
    const [usage, setUsage] = useState<"dalam_area" | "luar_area">(
        "dalam_area",
    );
    const [purpose, setPurpose] = useState("");
    const [location, setLocation] = useState("");
    const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
    const [due, setDue] = useState("");
    const [letter, setLetter] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const chosen = useMemo(
        () => tools.filter((t) => selected.includes(t.id)),
        [selected, tools],
    );
    const left = token.total - token.used - selected.length;
    const toggle = (id: number) =>
        setSelected((s) =>
            s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
        );
    const submit = () => {
        const data = new FormData();
        selected.forEach((id) => data.append("tool_type_ids[]", String(id)));
        data.append("usage_type", usage);
        data.append("purpose", purpose);
        data.append("location_text", location);
        data.append("start_date", start);
        if (due) data.append("due_date", due);
        if (letter) data.append("letter", letter);
        setProcessing(true);
        router.post("/peminjaman", data, {
            forceFormData: true,
            onError: (e: any) => {
                setErrors(e);
                setStep(e.tool_type_ids ? 1 : 3);
            },
            onFinish: () => setProcessing(false),
        });
    };
    return (
        <TamsLayout>
            <Head title="Pinjaman Baru" />
            <PageHeader
                eyebrow="New loan request"
                title="Ajukan Peminjaman"
                description="Satu jenis alat menggunakan satu token sampai inspeksi pengembalian selesai."
            />
            <div className="mb-6 grid grid-cols-4 overflow-hidden rounded-lg border bg-surface">
                {["Pilih Alat", "Area Pakai", "Detail", "Tinjau"].map(
                    (label, i) => (
                        <div
                            key={label}
                            className={`relative px-2 py-3 text-center text-xs font-bold ${step === i + 1 ? "bg-ink text-white" : step > i + 1 ? "bg-green/10 text-green" : "text-muted"}`}
                        >
                            <span className="mr-2 font-num">
                                {step > i + 1 ? "✓" : i + 1}
                            </span>
                            {label}
                        </div>
                    ),
                )}
            </div>
            {step === 1 && (
                <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                    <Panel className="overflow-hidden">
                        <div className="border-b p-5">
                            <h2 className="font-display text-2xl font-bold">
                                Pilih Jenis Alat
                            </h2>
                            <p className="text-sm text-muted">
                                Maksimal sesuai token yang tersedia.
                            </p>
                        </div>
                        <div className="grid gap-3 p-4 sm:grid-cols-2">
                            {tools.map((tool) => {
                                const active = selected.includes(tool.id);
                                return (
                                    <button
                                        type="button"
                                        key={tool.id}
                                        onClick={() => toggle(tool.id)}
                                        disabled={!active && left <= 0}
                                        className={`overflow-hidden rounded-lg border text-left ${active ? "border-green ring-2 ring-green/15" : "bg-white hover:border-ink"} disabled:opacity-40`}
                                    >
                                        <div className="grid grid-cols-[92px_1fr]">
                                            <AssetGlyph code={tool.code} />
                                            <div className="p-3">
                                                <p className="font-num text-[10px] text-muted">
                                                    {tool.code}
                                                </p>
                                                <h3 className="font-display text-lg font-bold leading-tight">
                                                    {tool.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-green">
                                                    {tool.available_count}{" "}
                                                    tersedia
                                                </p>
                                            </div>
                                        </div>
                                        {active && (
                                            <div className="flex items-center gap-2 bg-green px-3 py-2 text-xs font-bold text-white">
                                                <Check size={14} />
                                                Dipilih · 1 token
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.tool_type_ids && (
                            <p className="px-5 pb-4 text-sm text-red">
                                {errors.tool_type_ids}
                            </p>
                        )}
                    </Panel>
                    <div>
                        <TokenMeter
                            used={token.used + selected.length}
                            total={token.total}
                        />
                        <button
                            disabled={!selected.length}
                            onClick={() => setStep(2)}
                            className="btn-primary mt-4 w-full"
                        >
                            Pilih Area
                            <ArrowRight size={17} />
                        </button>
                    </div>
                </div>
            )}
            {step === 2 && (
                <Panel className="mx-auto max-w-3xl p-6">
                    <h2 className="font-display text-3xl font-bold">
                        Di mana alat digunakan?
                    </h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <UsageCard
                            active={usage === "dalam_area"}
                            onClick={() => setUsage("dalam_area")}
                            icon={MapPin}
                            title="Dalam Workshop"
                            desc="Tenggat otomatis Jumat terdekat. Tidak memerlukan surat."
                        />
                        <UsageCard
                            active={usage === "luar_area"}
                            onClick={() => setUsage("luar_area")}
                            icon={FileText}
                            title="Luar Workshop"
                            desc="Memerlukan periode, surat permohonan, dan approval Kepala Logistik."
                        />
                    </div>
                    <Actions back={() => setStep(1)} next={() => setStep(3)} />
                </Panel>
            )}
            {step === 3 && (
                <Panel className="mx-auto max-w-3xl p-6">
                    <h2 className="font-display text-3xl font-bold">
                        Detail Penggunaan
                    </h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Tujuan penggunaan"
                            error={errors.purpose}
                            wide
                        >
                            <textarea
                                className="control min-h-24"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="Jelaskan pekerjaan yang akan dilakukan..."
                            />
                        </Field>
                        <Field
                            label="Lokasi pekerjaan"
                            error={errors.location_text}
                            wide
                        >
                            <input
                                className="control"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Gedung / proyek / alamat"
                            />
                        </Field>
                        <Field label="Tanggal mulai" error={errors.start_date}>
                            <input
                                type="date"
                                className="control"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                            />
                        </Field>
                        {usage === "luar_area" && (
                            <Field
                                label="Tanggal kembali"
                                error={errors.due_date}
                            >
                                <input
                                    type="date"
                                    className="control"
                                    value={due}
                                    onChange={(e) => setDue(e.target.value)}
                                />
                            </Field>
                        )}
                        {usage === "luar_area" && (
                            <Field
                                label="Surat permohonan (PDF/JPG/PNG)"
                                error={errors.letter}
                                wide
                            >
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="control file:mr-3 file:border-0 file:bg-ink file:px-2 file:py-1 file:text-xs file:text-white"
                                    onChange={(e) =>
                                        setLetter(e.target.files?.[0] ?? null)
                                    }
                                />
                            </Field>
                        )}
                    </div>
                    <Actions
                        back={() => setStep(2)}
                        next={() => setStep(4)}
                        disabled={
                            !purpose ||
                            !location ||
                            (usage === "luar_area" && (!due || !letter))
                        }
                    />
                </Panel>
            )}
            {step === 4 && (
                <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-[1fr_320px]">
                    <Panel className="p-6">
                        <p className="label">Pemeriksaan Akhir</p>
                        <h2 className="font-display text-3xl font-bold">
                            Ringkasan Permohonan
                        </h2>
                        <div className="mt-5 space-y-3">
                            {chosen.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between rounded border bg-canvas/50 p-3"
                                >
                                    <div>
                                        <p className="font-display text-lg font-bold">
                                            {t.name}
                                        </p>
                                        <p className="font-num text-xs text-muted">
                                            {t.code}
                                        </p>
                                    </div>
                                    <span className="rounded bg-amber/15 px-2 py-1 text-xs font-bold">
                                        1 token
                                    </span>
                                </div>
                            ))}
                        </div>
                        <dl className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
                            <Summary
                                label="Area penggunaan"
                                value={
                                    usage === "luar_area"
                                        ? "Luar Workshop Trowulan"
                                        : "Dalam Workshop Trowulan"
                                }
                            />
                            <Summary label="Lokasi" value={location} />
                            <Summary label="Mulai" value={start} />
                            <Summary
                                label="Dokumen"
                                value={
                                    usage === "luar_area"
                                        ? (letter?.name ?? "Belum ada")
                                        : "Tidak diperlukan"
                                }
                            />
                        </dl>
                    </Panel>
                    <div>
                        <Panel className="p-5">
                            <PackagePlus className="text-green" />
                            <p className="mt-3 text-sm text-muted">
                                Token setelah diajukan
                            </p>
                            <p
                                className={`font-num text-4xl font-semibold ${left < 0 ? "text-red" : ""}`}
                            >
                                {left}
                            </p>
                            <p className="mt-4 text-xs leading-relaxed text-muted">
                                Dengan mengirim permohonan, Anda menyetujui
                                pemeriksaan bersama dan tanggung jawab atas
                                alat.
                            </p>
                        </Panel>
                        <button
                            disabled={processing || left < 0}
                            onClick={submit}
                            className="btn-primary mt-4 w-full"
                        >
                            {processing ? "Mengirim..." : "Kirim Permohonan"}
                            <ArrowRight size={17} />
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="btn-secondary mt-2 w-full"
                        >
                            <ArrowLeft size={17} />
                            Ubah Detail
                        </button>
                    </div>
                </div>
            )}
        </TamsLayout>
    );
}
function UsageCard({
    active,
    onClick,
    icon: Icon,
    title,
    desc,
}: {
    active: boolean;
    onClick: () => void;
    icon: any;
    title: string;
    desc: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-lg border p-5 text-left ${active ? "border-green bg-green/5 ring-2 ring-green/10" : "bg-white hover:border-ink"}`}
        >
            <Icon className={active ? "text-green" : "text-muted"} size={28} />
            <h3 className="mt-5 font-display text-2xl font-bold">{title}</h3>
            <p className="mt-2 text-sm text-muted">{desc}</p>
            {active && (
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-green">
                    <Check size={15} />
                    Dipilih
                </span>
            )}
        </button>
    );
}
function Actions({
    back,
    next,
    disabled = false,
}: {
    back: () => void;
    next: () => void;
    disabled?: boolean;
}) {
    return (
        <div className="mt-6 flex justify-between border-t pt-5">
            <button onClick={back} className="btn-secondary">
                <ArrowLeft size={17} />
                Kembali
            </button>
            <button disabled={disabled} onClick={next} className="btn-primary">
                Lanjutkan
                <ArrowRight size={17} />
            </button>
        </div>
    );
}
function Field({
    label,
    error,
    wide = false,
    children,
}: {
    label: string;
    error?: string;
    wide?: boolean;
    children: any;
}) {
    return (
        <label className={wide ? "sm:col-span-2" : ""}>
            <span className="label">{label}</span>
            {children}
            {error && (
                <span className="mt-1 block text-xs text-red">{error}</span>
            )}
        </label>
    );
}
function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {label}
            </dt>
            <dd className="mt-1 text-sm font-semibold">{value}</dd>
        </div>
    );
}
