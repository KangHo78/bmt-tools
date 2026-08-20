import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    PackageCheck,
    ScanLine,
} from "lucide-react";
import { useState } from "react";
import { Panel, StatusBadge } from "@/Components/TamsUI";
import type { Loan } from "@/types/tams";

export default function Handover({ loan }: { loan: Loan }) {
    const [codes, setCodes] = useState<Record<number, string>>(
        Object.fromEntries(
            loan.items.map((i) => [i.id, i.unit?.asset_code ?? ""]),
        ),
    );
    const [staff, setStaff] = useState(false);
    const [borrower, setBorrower] = useState(false);
    const [photo, setPhoto] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const submit = () => {
        const data = new FormData();
        Object.entries(codes).forEach(([id, code]) =>
            data.append(`unit_codes[${id}]`, code),
        );
        if (staff) data.append("confirm_staff", "1");
        if (borrower) data.append("confirm_borrower", "1");
        if (photo) data.append("photo", photo);
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
                                    {item.physical_token && <p className="mt-2 inline-flex rounded bg-amber/15 px-2 py-1 font-num text-xs font-bold">Kepingan {item.physical_token.code}</p>}
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
                                            className="control pl-10 font-num"
                                            value={codes[item.id]}
                                            onChange={(e) =>
                                                setCodes({
                                                    ...codes,
                                                    [item.id]:
                                                        e.target.value.toUpperCase(),
                                                })
                                            }
                                            placeholder={`${item.tool_type.code}-2026-0001`}
                                        />
                                    </div>
                                    {errors[`unit_codes.${item.id}`] && (
                                        <p className="mt-1 text-xs text-red">
                                            {errors[`unit_codes.${item.id}`]}
                                        </p>
                                    )}
                                </label>
                            </div>
                        </Panel>
                    ))}
                </div>
                <Panel className="mt-5 p-5">
                    <label className="block cursor-pointer rounded-lg border-2 border-dashed border-line p-6 text-center hover:border-ink">
                        <Camera className="mx-auto text-muted" />
                        <p className="mt-2 text-sm font-semibold">
                            Foto kondisi saat serah terima
                        </p>
                        <p className="mt-1 text-xs text-muted">
                            JPG/PNG maksimal 5 MB
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="sr-only"
                            onChange={(e) =>
                                setPhoto(e.target.files?.[0] ?? null)
                            }
                        />
                        {photo && (
                            <p className="mt-3 font-num text-xs text-green">
                                {photo.name}
                            </p>
                        )}
                    </label>
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
                            Object.values(codes).some((x) => !x)
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
