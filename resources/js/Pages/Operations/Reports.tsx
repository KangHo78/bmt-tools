import { Head } from "@inertiajs/react";
import {
    Boxes,
    Download,
    PackageCheck,
    Printer,
    ShieldAlert,
    Wrench,
} from "lucide-react";
import TamsLayout from "@/Layouts/TamsLayout";
import { PageHeader, Panel, StatusBadge } from "@/Components/TamsUI";

export default function Reports({
    summary,
    byStatus,
    monthlyLoans,
}: {
    summary: Record<string, number>;
    byStatus: any[];
    monthlyLoans: any[];
}) {
    const max = Math.max(1, ...byStatus.map((x) => Number(x.total)));
    return (
        <TamsLayout>
            <Head title="Laporan" />
            <PageHeader
                eyebrow="Management insight"
                title="Laporan Aset"
                description="Snapshot ketersediaan, sirkulasi, dan risiko aset Workshop Trowulan."
                action={
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="btn-secondary"
                        >
                            <Printer size={16} />
                            Cetak / Simpan PDF
                        </button>
                        <a
                            href="/laporan/ekspor/assets"
                            className="btn-secondary"
                        >
                            <Download size={16} />
                            Aset CSV
                        </a>
                        <a
                            href="/laporan/ekspor/loans"
                            className="btn-secondary"
                        >
                            <Download size={16} />
                            Pinjaman CSV
                        </a>
                        <a
                            href="/laporan/ekspor/audits"
                            className="btn-secondary"
                        >
                            <Download size={16} />
                            Audit CSV
                        </a>
                    </div>
                }
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Metric value={summary.total} label="Total Unit" icon={Boxes} />
                <Metric
                    value={summary.available}
                    label="Tersedia"
                    icon={PackageCheck}
                />
                <Metric
                    value={summary.borrowed}
                    label="Dipinjam"
                    icon={Boxes}
                />
                <Metric
                    value={summary.maintenance}
                    label="Perawatan"
                    icon={Wrench}
                />
                <Metric
                    value={summary.lost_or_damaged}
                    label="Rusak/Hilang"
                    icon={ShieldAlert}
                />
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <Panel className="p-5">
                    <p className="label">Distribusi kondisi</p>
                    <h2 className="font-display text-2xl font-bold">
                        Status Unit
                    </h2>
                    <div className="mt-6 space-y-4">
                        {byStatus.map((x) => (
                            <div
                                key={x.status}
                                className="grid grid-cols-[130px_1fr_40px] items-center gap-3"
                            >
                                <StatusBadge status={x.status} />
                                <div className="h-3 rounded-sm bg-line">
                                    <div
                                        className="h-full rounded-sm bg-green"
                                        style={{
                                            width: `${(Number(x.total) / max) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="font-num text-right text-sm font-bold">
                                    {x.total}
                                </span>
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel className="p-5">
                    <p className="label">Volume permohonan</p>
                    <h2 className="font-display text-2xl font-bold">
                        Peminjaman Bulanan
                    </h2>
                    <div className="mt-6 flex h-52 items-end gap-3 border-b border-l p-4">
                        {monthlyLoans.map((x) => (
                            <div
                                key={x.period}
                                className="flex h-full flex-1 flex-col justify-end text-center"
                            >
                                <span className="mb-2 font-num text-xs font-bold">
                                    {x.total}
                                </span>
                                <div
                                    className="mx-auto w-full max-w-16 bg-amber"
                                    style={{
                                        height: `${Math.max(8, Number(x.total) * 30)}px`,
                                    }}
                                />
                                <span className="mt-2 text-[10px] text-muted">
                                    {x.period}
                                </span>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </TamsLayout>
    );
}
function Metric({
    value,
    label,
    icon: Icon,
}: {
    value: number;
    label: string;
    icon: any;
}) {
    return (
        <Panel className="p-4">
            <Icon className="text-green" size={20} />
            <p className="mt-4 font-num text-3xl font-semibold">{value}</p>
            <p className="text-xs font-semibold text-muted">{label}</p>
        </Panel>
    );
}
