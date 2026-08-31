import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    CheckCircle2,
    FileText,
    PackageCheck,
    ScanLine,
    Upload,
} from "lucide-react";
import { useState } from "react";
import { Panel, StatusBadge } from "@/Components/TamsUI";
import type { Loan } from "@/types/tams";

export default function Handover({ loan }: { loan: Loan }) {
    const codes: Record<number, string> = Object.fromEntries(
        loan.items.map((item) => [item.id, item.unit?.asset_code ?? ""]),
    );
    const [staff, setStaff] = useState(false);
    const [borrower, setBorrower] = useState(false);
    const [evidence, setEvidence] = useState<Record<number, File | null>>(
        Object.fromEntries(loan.items.map((item) => [item.id, null])),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const submit = () => {
        const data = new FormData();
        Object.entries(codes).forEach(([id, code]) =>
            data.append(`unit_codes[${id}]`, code),
        );
        if (staff) data.append("confirm_staff", "1");
        if (borrower) data.append("confirm_borrower", "1");
        Object.entries(evidence).forEach(([id, file]) => {
            if (file) data.append(`handover_evidence[${id}]`, file);
        });
        setProcessing(true);
        router.post(`/serah-terima/${loan.id}`, data, {
            forceFormData: true,
            onError: (e: any) => setErrors(e),
            onFinish: () => setProcessing(false),
        });
    };
    return (
        <div className="min-h-screen bg-canvas bg-grid">
            <Head title={`Serah Terima ${loan.trx_no}`} />
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
                        SERAH TERIMA
                    </p>
                </div>
                <StatusBadge status={loan.status} />
            </header>
            <main className="mx-auto max-w-5xl p-4 py-8 sm:p-8">
                <div className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-[.18em] text-green">
                        Focus workflow
                    </p>
                    <h1 className="font-display text-4xl font-bold">
                        Cocokkan Unit Fisik
                    </h1>
                    <p className="mt-2 text-sm text-muted">
                        Pindai setiap label, periksa kelengkapan, lalu
                        konfirmasi bersama {loan.borrower.name}.
                    </p>
                </div>
                <div className="space-y-4">
                    {loan.items.map((item, index) => (
                        <Panel key={item.id} className="overflow-hidden">
                            <div className="grid gap-4 p-5 md:grid-cols-[48px_1fr_1fr]">
                                <div className="grid size-10 place-items-center rounded bg-ink font-num font-bold text-white">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-display text-2xl font-bold">
                                        {item.tool_type.name}
                                    </p>
                                    <p className="font-num text-xs text-muted">
                                        {item.tool_type.code}
                                    </p>
                                    {item.physical_token && (
                                        <p className="mt-2 inline-flex rounded bg-amber/15 px-2 py-1 font-num text-xs font-bold">
                                            Kepingan {item.physical_token.code}
                                        </p>
                                    )}
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {item.tool_type.checklist?.map((x) => (
                                            <span
                                                key={x}
                                                className="rounded border bg-canvas px-2 py-1 text-[10px] font-semibold"
                                            >
                                                ✓ {x}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <label>
                                    <span className="label">Kode unit</span>
                                    <div className="relative">
                                        <ScanLine
                                            className="absolute left-3 top-3.5 text-muted"
                                            size={17}
                                        />
                                        <input
                                            className="control cursor-not-allowed bg-canvas pl-10 font-num text-ink/75"
                                            value={codes[item.id]}
                                            readOnly
                                            aria-readonly="true"
                                            title="Kode unit ditentukan dari unit yang telah direservasi"
                                        />
                                    </div>
                                    {errors[`unit_codes.${item.id}`] && (
                                        <p className="mt-1 text-xs text-red">
                                            {errors[`unit_codes.${item.id}`]}
                                        </p>
                                    )}
                                </label>
                            </div>
                            <div className="border-t border-line bg-canvas/45 p-5">
                                <label
                                    className={`grid cursor-pointer gap-3 rounded-lg border-2 border-dashed p-4 transition sm:grid-cols-[auto_1fr_auto] sm:items-center ${evidence[item.id] ? "border-green bg-green/5" : "border-line bg-surface hover:border-ink"}`}
                                >
                                    <span
                                        className={`grid size-10 place-items-center rounded-md ${evidence[item.id] ? "bg-green text-white" : "bg-ink text-white"}`}
                                    >
                                        {evidence[item.id]?.type ===
                                        "application/pdf" ? (
                                            <FileText size={19} />
                                        ) : (
                                            <Upload size={19} />
                                        )}
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold">
                                            Bukti kondisi unit saat serah terima
                                        </span>
                                        <span className="mt-1 block font-num text-xs text-muted">
                                            {evidence[item.id]?.name ??
                                                "Pilih JPG, PNG, atau PDF · maksimal 5 MB"}
                                        </span>
                                    </span>
                                    <span className="btn-secondary pointer-events-none !min-h-9 !px-3 text-xs">
                                        {evidence[item.id]
                                            ? "Ganti file"
                                            : "Pilih file"}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                        className="sr-only"
                                        onChange={(event) =>
                                            setEvidence({
                                                ...evidence,
                                                [item.id]:
                                                    event.target.files?.[0] ??
                                                    null,
                                            })
                                        }
                                    />
                                </label>
                                {errors[`handover_evidence.${item.id}`] && (
                                    <p className="mt-2 text-xs font-semibold text-red">
                                        {errors[`handover_evidence.${item.id}`]}
                                    </p>
                                )}
                            </div>
                        </Panel>
                    ))}
                </div>
                <Panel className="mt-5 p-5">
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <Confirm
                            checked={staff}
                            set={setStaff}
                            title="Petugas Gudang"
                            desc="Saya telah memeriksa unit dan kelengkapan."
                        />
                        <Confirm
                            checked={borrower}
                            set={setBorrower}
                            title="Peminjam"
                            desc="Saya menerima unit dalam kondisi yang dicatat."
                        />
                    </div>
                    {Object.values(errors).length > 0 && (
                        <p className="mt-4 text-sm text-red">
                            Lengkapi data dan periksa kembali kode unit.
                        </p>
                    )}
                    <button
                        disabled={
                            processing ||
                            !staff ||
                            !borrower ||
                            Object.values(codes).some((x) => !x) ||
                            Object.values(evidence).some((file) => !file)
                        }
                        onClick={submit}
                        className="btn-primary mt-5 w-full"
                    >
                        <PackageCheck size={18} />
                        {processing
                            ? "Menyimpan..."
                            : "Selesaikan Serah Terima"}
                    </button>
                </Panel>
            </main>
        </div>
    );
}
function Confirm({
    checked,
    set,
    title,
    desc,
}: {
    checked: boolean;
    set: (v: boolean) => void;
    title: string;
    desc: string;
}) {
    return (
        <label
            className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${checked ? "border-green bg-green/5" : "bg-white"}`}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => set(e.target.checked)}
                className="mt-1 size-5 accent-green"
            />
            <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-xs text-muted">{desc}</p>
            </div>
            {checked && (
                <CheckCircle2 className="ml-auto text-green" size={19} />
            )}
        </label>
    );
}
