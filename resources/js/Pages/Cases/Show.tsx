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
                    {c.loan && c.stage !== "selesai" && (
                        <Panel className="border-l-4 !border-l-amber p-5">
                            <p className="font-num text-[10px] font-bold uppercase tracking-[.16em] text-amber-ink">
                                Pengembalian tertahan
                            </p>
                            <h2 className="mt-1 font-display text-2xl font-bold">
                                Token belum dilepas
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                Item dari transaksi {c.loan.trx_no} baru
                                dianggap selesai dikembalikan setelah kasus ini
                                ditutup dengan Berita Acara dan keputusan final.
                            </p>
                            <Link
                                href={`/peminjaman/${c.loan.id}`}
                                className="btn-secondary mt-4 w-full"
                            >
                                Buka Transaksi
                            </Link>
                        </Panel>
                    )}
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
                                    ["belum_diproses", "Belum diproses"],
                                    ["dalam_proses", "Dalam proses"],
                                    ["diperbaiki", "Diperbaiki"],
                                    ["sudah_diganti", "Diganti unit lain"],
                                    ["dibeli_baru", "Dibelikan unit baru"],
                                    [
                                        "tidak_mengganti",
                                        "Tidak perlu penggantian",
                                    ],
                                    ["dibebaskan", "Tanggung jawab dibebaskan"],
                                ].map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </SearchableSelect>
                            {errors.resolution_status && (
                                <span className="text-xs text-red">
                                    {errors.resolution_status}
                                </span>
                            )}
                        </Field>
                        <Field
                            label="Unit pengganti / unit hasil pembelian"
                            wide
                        >
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
                                {replacementUnits
                                    .filter(
                                        (unit) =>
                                            !c.unit?.tool_type?.id ||
                                            unit.tool_type.id ===
                                                c.unit.tool_type.id,
                                    )
                                    .map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.asset_code} · {u.tool_type.name}
                                        </option>
                                    ))}
                            </SearchableSelect>
                            <span className="mt-1 block text-[10px] leading-relaxed text-muted">
                                Wajib untuk keputusan “diganti” atau “dibelikan
                                baru”. Unit hasil pembelian harus dicatat di
                                penerimaan aset terlebih dahulu.
                            </span>
                            {errors.replacement_unit_id && (
                                <span className="text-xs text-red">
                                    {errors.replacement_unit_id}
                                </span>
                            )}
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
                        Menutup kasus akan menyelesaikan pengembalian item dan
                        melepas token peminjam. Berita Acara, keputusan, dan
                        hasil penyelesaian wajib lengkap.
                    </div>
                    <button
                        onClick={submit}
                        className="btn-primary mt-5 w-full"
                    >
                        <ShieldCheck size={17} />
                        {d.stage === "selesai"
                            ? "Tutup Kasus & Selesaikan Pengembalian"
                            : "Simpan Tindak Lanjut"}
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
