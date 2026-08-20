import { Head, Link } from "@inertiajs/react";
import { ArrowRight, FileWarning } from "lucide-react";
import TamsLayout from "@/Layouts/TamsLayout";
import {
    EmptyState,
    PageHeader,
    Panel,
    StatusBadge,
} from "@/Components/TamsUI";

export default function Index({ cases }: { cases: any[] }) {
    return (
        <TamsLayout>
            <Head title="Kasus" />
            <PageHeader
                eyebrow="Accountability desk"
                title="Kerusakan & Kehilangan"
                description="Kelengkapan bukti, Berita Acara, keputusan, dan penggantian aset."
            />
            <div className="grid gap-4 lg:grid-cols-2">
                {cases.length ? (
                    cases.map((c) => (
                        <Panel key={c.id} className="overflow-hidden">
                            <div
                                className={`h-2 ${c.type === "hilang" ? "bg-red" : "hazard-stripe"}`}
                            />
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-num text-xs font-bold text-muted">
                                            {c.case_no}
                                        </p>
                                        <h2 className="font-display text-2xl font-bold capitalize">
                                            {c.type} · {c.unit?.tool_type?.name}
                                        </h2>
                                        <p className="font-num text-[10px] text-muted">
                                            {c.unit?.asset_code}
                                        </p>
                                    </div>
                                    <StatusBadge status={c.stage} />
                                </div>
                                <p className="mt-4 line-clamp-2 text-sm text-muted">
                                    {c.chronology}
                                </p>
                                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                                    <Check ok={c.has_evidence} label="BUKTI" />
                                    <Check
                                        ok={c.has_berita_acara}
                                        label="BERITA ACARA"
                                    />
                                    <Check
                                        ok={c.has_decision}
                                        label="KEPUTUSAN"
                                    />
                                </div>
                                <Link
                                    href={`/kasus/${c.id}`}
                                    className="btn-secondary mt-4 w-full"
                                >
                                    <FileWarning size={17} />
                                    Kelola Kasus
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </Panel>
                    ))
                ) : (
                    <Panel className="lg:col-span-2">
                        <EmptyState title="Tidak ada kasus tercatat" />
                    </Panel>
                )}
            </div>
        </TamsLayout>
    );
}
function Check({ ok, label }: { ok: boolean; label: string }) {
    return (
        <div
            className={`rounded border p-2 ${ok ? "border-green/30 bg-green/10 text-green" : "border-red/30 bg-red/10 text-red"}`}
        >
            {ok ? "✓" : "!"} {label}
        </div>
    );
}
