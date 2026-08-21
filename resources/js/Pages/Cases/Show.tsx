import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import SearchableSelect from "@/Components/SearchableSelect";
import { PageHeader, Panel, StatusBadge } from "@/Components/TamsUI";

export default function Show({
    caseData: c,
    replacementUnits,
}: {
    caseData: any;
    replacementUnits: any[];
}) {
    const [d, setD] = useState({
        stage: c.stage,
        decision: c.decision ?? "",
        resolution_status: c.resolution_status,
        replacement_unit_id: c.replacement_unit_id ?? "",
    });
    const [report, setReport] = useState<File | null>(null);
    const [evidence, setEvidence] = useState<File[]>([]);
    const [errors, setErrors] = useState<any>({});
    const submit = () => {
        const fd = new FormData();
        Object.entries(d).forEach(([k, v]) => fd.append(k, String(v)));
        if (report) fd.append("report", report);
        evidence.forEach((x) => fd.append("evidence[]", x));
        router.post(`/kasus/${c.id}`, fd, {
            forceFormData: true,
            onError: setErrors,
        });
    };
    return (
        <TamsLayout>
            <Head title={c.case_no} />
            <Link
                href="/kasus"
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted"
            >
                <ArrowLeft size={16} />
                Daftar kasus
            </Link>
            <PageHeader
                eyebrow="Case file"
                title={c.case_no}
                description={`${c.type.toUpperCase()} · ${c.unit?.asset_code ?? "Unit tidak diketahui"}`}
                action={<StatusBadge status={c.stage} />}
            />
            <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
                <div className="space-y-5">
                    <Panel className="p-5">
                        <p className="label">Kronologi</p>
                        <p className="text-sm leading-relaxed">
                            {c.chronology}
                        </p>
                        <div className="mt-5 border-t pt-4">
                            <p className="label">Penanggung jawab</p>
                            <p className="font-semibold">
                                {c.responsible_user?.name ?? "Belum ditentukan"}
                            </p>
                            <p className="text-xs text-muted">
                                {c.responsible_user?.institution}
                            </p>
                        </div>
                    </Panel>
                    <Panel className="p-5">
                        <p className="label">Kelengkapan berkas</p>
                        <Doc
                            ok={c.has_evidence}
                            label={`${c.evidence_urls?.length ?? 0} foto bukti`}
                        />
                        <Doc ok={c.has_berita_acara} label="Berita Acara" />
                        {c.report_url && (
                            <a
                                href={`/storage/${c.report_url}`}
                                target="_blank"
                                className="btn-secondary mt-3 w-full"
                            >
                                <FileText size={16} />
                                Buka Berita Acara
                            </a>
                        )}
                        <Doc ok={c.has_decision} label="Keputusan lembaga" />
                    </Panel>
                </div>
                <Panel className="p-5">
                    <p className="label">Case resolution workflow</p>
                    <h2 className="font-display text-3xl font-bold">
                        Tindak Lanjut
                    </h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <Field label="Tahap">
                            <SearchableSelect
                                className="control"
                                value={d.stage}
                                onChange={(e) =>
                                    setD({ ...d, stage: e.target.value })
                                }
                            >
                                {[
                                    "dilaporkan",
                                    "investigasi",
                                    "berita_acara",
                                    "keputusan",
                                    "selesai",
                                ].map((x) => (
                                    <option key={x} value={x}>
                                        {x.replaceAll("_", " ")}
                                    </option>
                                ))}
                            </SearchableSelect>
                            {errors.stage && (
                                <span className="text-xs text-red">
                                    {errors.stage}
                                </span>
                            )}
                        </Field>
                        <Field label="Status penyelesaian">
                            <SearchableSelect
                                className="control"
                                value={d.resolution_status}
                                onChange={(e) =>
                                    setD({
                                        ...d,
                                        resolution_status: e.target.value,
                                    })
                                }
                            >
                                {[
                                    "belum_diproses",
                                    "dalam_proses",
                                    "diperbaiki",
                                    "sudah_diganti",
                                    "tidak_mengganti",
                                    "dibebaskan",
                                ].map((x) => (
                                    <option key={x}>
                                        {x.replaceAll("_", " ")}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </Field>
                        <Field label="Unit pengganti (opsional)" wide>
                            <SearchableSelect
                                className="control"
                                value={d.replacement_unit_id}
                                onChange={(e) =>
                                    setD({
                                        ...d,
                                        replacement_unit_id: e.target.value,
                                    })
                                }
                            >
                                <option value="">Belum ada</option>
                                {replacementUnits.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.asset_code} · {u.tool_type.name}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </Field>
                        <Field label="Keputusan lembaga" wide>
                            <textarea
                                className="control min-h-28"
                                value={d.decision}
                                onChange={(e) =>
                                    setD({ ...d, decision: e.target.value })
                                }
                                placeholder="Hasil review: perbaiki, beli pengganti, atau keputusan lainnya..."
                            />
                        </Field>
                        <Field label="Berita Acara (PDF/JPG/PNG)">
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="control"
                                onChange={(e) =>
                                    setReport(e.target.files?.[0] ?? null)
                                }
                            />
                        </Field>
                        <Field label="Foto bukti">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="control"
                                onChange={(e) =>
                                    setEvidence(
                                        Array.from(e.target.files ?? []),
                                    )
                                }
                            />
                        </Field>
                    </div>
                    <div className="mt-5 rounded border border-amber/40 bg-amber/10 p-3 text-xs text-amber-ink">
                        Kasus hanya dapat ditutup jika Berita Acara dan
                        keputusan lembaga sudah lengkap.
                    </div>
                    <button
                        onClick={submit}
                        className="btn-primary mt-5 w-full"
                    >
                        <ShieldCheck size={17} />
                        Simpan Tindak Lanjut
                    </button>
                </Panel>
            </div>
        </TamsLayout>
    );
}
function Doc({ ok, label }: { ok: boolean; label: string }) {
    return (
        <div
            className={`mt-2 flex items-center gap-2 rounded border p-3 text-sm ${ok ? "border-green/30 bg-green/10 text-green" : "border-red/30 bg-red/10 text-red"}`}
        >
            <span className="font-bold">{ok ? "✓" : "!"}</span>
            {label}
        </div>
    );
}
function Field({
    label,
    wide = false,
    children,
}: {
    label: string;
    wide?: boolean;
    children: any;
}) {
    return (
        <label className={wide ? "sm:col-span-2" : ""}>
            <span className="label">{label}</span>
            {children}
        </label>
    );
}
