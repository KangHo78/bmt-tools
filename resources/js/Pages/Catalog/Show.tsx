import { Head, Link, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    MapPin,
    PackageCheck,
    Plus,
    Printer,
    ShieldCheck,
} from "lucide-react";
import TamsLayout from "@/Layouts/TamsLayout";
import { AssetGlyph, Panel, StatusBadge } from "@/Components/TamsUI";
import type { PageProps, ToolType } from "@/types/tams";

export default function Show({ tool }: { tool: ToolType }) {
    const role = usePage<PageProps>().props.auth.user.role;
    const canPrint = role === "petugas" || role === "admin";
    const available =
        tool.units?.filter((x) => x.status === "tersedia").length ?? 0;
    return (
        <TamsLayout>
            <Head title={tool.name} />
            <Link
                href="/katalog"
                className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
            >
                <ArrowLeft size={16} />
                Kembali ke katalog
            </Link>
            <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
                <Panel className="overflow-hidden">
                    <AssetGlyph code={tool.code} className="min-h-72" />
                </Panel>
                <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="font-num text-xs font-bold uppercase tracking-[.16em] text-green">
                                {tool.code}
                            </p>
                            <h1 className="mt-1 font-display text-5xl font-bold leading-none">
                                {tool.name}
                            </h1>
                            <p className="mt-3 text-sm text-muted">
                                {tool.category?.name} · {tool.size}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {canPrint && (
                                <Link
                                    href={`/katalog/${tool.id}/label`}
                                    className={`btn-secondary ${!tool.units?.length ? "pointer-events-none opacity-50" : ""}`}
                                >
                                    <Printer size={17} />
                                    Cetak Semua Label
                                </Link>
                            )}
                            <Link
                                href={`/peminjaman/baru?tool=${tool.id}`}
                                className={`btn-primary ${available === 0 ? "pointer-events-none opacity-50" : ""}`}
                            >
                                <Plus size={17} />
                                Pinjam Alat
                            </Link>
                        </div>
                    </div>
                    <p className="mt-6 max-w-2xl leading-relaxed text-muted">
                        {tool.description}
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <Info
                            icon={PackageCheck}
                            label="Ketersediaan"
                            value={`${available} dari ${tool.units?.length ?? 0} unit`}
                        />
                        <Info
                            icon={MapPin}
                            label="Lokasi Utama"
                            value={tool.primary_location?.name ?? "—"}
                        />
                        <Info
                            icon={ShieldCheck}
                            label="Ketentuan"
                            value="Inspeksi wajib"
                        />
                    </div>
                    <Panel className="mt-5 p-5">
                        <p className="label">Aturan penggunaan</p>
                        <p className="text-sm">{tool.rules_summary}</p>
                    </Panel>
                </div>
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_.7fr]">
                <Panel className="overflow-hidden">
                    <div className="border-b p-5">
                        <p className="label">Asset passport</p>
                        <h2 className="font-display text-2xl font-bold">
                            Daftar Unit
                        </h2>
                    </div>
                    <div className="divide-y">
                        {tool.units?.map((unit) => (
                            <div
                                key={unit.id}
                                className="flex flex-wrap items-center justify-between gap-3 p-4"
                            >
                                <div>
                                    <p className="font-num text-sm font-bold">
                                        {unit.asset_code}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        {unit.serial_number} ·{" "}
                                        {unit.location?.name}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={unit.status} />
                                    {canPrint && (
                                        <Link
                                            href={`/katalog/${tool.id}/label?unit=${unit.id}`}
                                            className="btn-secondary !min-h-9 !px-3"
                                            aria-label={`Cetak label ${unit.asset_code}`}
                                        >
                                            <Printer size={15} />
                                            Label
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel className="p-5">
                    <p className="label">Checklist standar</p>
                    <h2 className="font-display text-2xl font-bold">
                        Kelengkapan
                    </h2>
                    <div className="mt-4 space-y-2">
                        {tool.checklist?.map((item) => (
                            <div
                                key={item}
                                className="flex items-center gap-3 rounded border bg-canvas/50 p-3 text-sm"
                            >
                                <span className="grid size-5 place-items-center rounded-sm bg-green text-xs text-white">
                                    ✓
                                </span>
                                {item}
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </TamsLayout>
    );
}
function Info({
    icon: Icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value: string;
}) {
    return (
        <Panel className="p-4">
            <Icon className="mb-3 text-green" size={20} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
        </Panel>
    );
}
