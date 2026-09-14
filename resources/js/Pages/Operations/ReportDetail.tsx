import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    Boxes,
    ClipboardList,
    Download,
    ListTree,
    PackageCheck,
    Printer,
    ScanLine,
    Search,
    ShieldAlert,
    Users,
    Wrench,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import {
    EmptyState,
    PageHeader,
    Panel,
    StatusBadge,
} from "@/Components/TamsUI";
import { formatDate } from "@/lib/ui";

type Kind = "assets" | "loans" | "audits" | "active-users" | "borrowed-items";
type Props = {
    kind: Kind;
    summary: Record<string, number>;
    rows: any[];
    byStatus?: Array<{ status: string; total: number }>;
    monthlyLoans?: Array<{ period: string; total: number }>;
};
type Column = [string, (row: any) => ReactNode];

const meta: Record<
    Kind,
    { title: string; eyebrow: string; description: string; exportLabel: string }
> = {
    assets: {
        title: "Laporan Aset",
        eyebrow: "Asset register",
        description: "Posisi, kondisi, lokasi, dan status seluruh unit aset.",
        exportLabel: "Ekspor Aset",
    },
    loans: {
        title: "Laporan Peminjaman",
        eyebrow: "Circulation history",
        description: "Riwayat dan tren seluruh transaksi peminjaman.",
        exportLabel: "Ekspor Peminjaman",
    },
    audits: {
        title: "Laporan Audit",
        eyebrow: "Stock opname",
        description: "Cakupan dan progres pemeriksaan fisik aset.",
        exportLabel: "Ekspor Audit",
    },
    "active-users": {
        title: "Laporan Pengguna Aktif",
        eyebrow: "Current custody",
        description: "Pengguna yang masih memegang satu atau lebih unit.",
        exportLabel: "Ekspor Pengguna",
    },
    "borrowed-items": {
        title: "Laporan Item Dipinjam",
        eyebrow: "Active circulation",
        description: "Unit aktif yang dikelompokkan berdasarkan jenis alat.",
        exportLabel: "Ekspor Item",
    },
};

const reportLinks: Array<[Kind, string, string]> = [
    ["assets", "/laporan/aset", "Aset"],
    ["loans", "/laporan/peminjaman", "Peminjaman"],
    ["active-users", "/laporan/pengguna-aktif", "Pengguna Aktif"],
    ["borrowed-items", "/laporan/item-dipinjam", "Item Dipinjam"],
    ["audits", "/laporan/audit", "Audit"],
];

export default function ReportDetail({
    kind,
    summary,
    rows,
    byStatus = [],
    monthlyLoans = [],
}: Props) {
    const config = meta[kind];
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const needle = query.trim().toLocaleLowerCase("id-ID");
        return needle
            ? rows.filter((row) =>
                  JSON.stringify(row)
                      .toLocaleLowerCase("id-ID")
                      .includes(needle),
              )
            : rows;
    }, [query, rows]);

    return (
        <TamsLayout>
            <Head title={config.title} />
            <div className="mb-5 flex flex-wrap items-center gap-2 print:hidden">
                <Link href="/laporan" className="btn-secondary !px-3">
                    <ArrowLeft size={16} /> Pusat Laporan
                </Link>
                <div className="flex flex-wrap gap-1 rounded-md border border-line bg-surface p-1">
                    {reportLinks.map(([key, href, label]) => (
                        <Link
                            key={key}
                            href={href}
                            className={`rounded px-3 py-2 text-xs font-bold transition ${kind === key ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink"}`}
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
            <PageHeader
                eyebrow={config.eyebrow}
                title={config.title}
                description={config.description}
                action={
                    <div className="flex flex-wrap gap-2 print:hidden">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="btn-secondary"
                        >
                            <Printer size={16} /> Cetak / PDF
                        </button>
                        <a
                            href={`/laporan/ekspor/${kind}`}
                            className="btn-secondary"
                        >
                            <Download size={16} /> {config.exportLabel}
                        </a>
                    </div>
                }
            />
            <Summary kind={kind} values={summary} />
            {kind === "assets" && <AssetInsights byStatus={byStatus} />}
            {kind === "loans" && (
                <LoanInsights byStatus={byStatus} monthly={monthlyLoans} />
            )}
            <Panel className="mt-5 overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-line bg-ink p-5 text-white sm:flex-row sm:items-end sm:justify-between print:bg-white print:text-ink">
                    <div>
                        <p className="font-num text-[10px] font-bold uppercase tracking-[.18em] text-amber">
                            Detailed register
                        </p>
                        <h2 className="mt-1 font-display text-2xl font-bold">
                            Rincian Data
                        </h2>
                        <p className="mt-1 text-xs text-white/55 print:text-muted">
                            {filtered.length} dari {rows.length} baris
                        </p>
                    </div>
                    <div className="relative w-full sm:max-w-sm print:hidden">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
                            size={16}
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Cari dalam laporan..."
                            className="control border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/40"
                        />
                    </div>
                </div>
                <ReportRows kind={kind} rows={filtered} />
            </Panel>
        </TamsLayout>
    );
}

function Summary({
    kind,
    values,
}: {
    kind: Kind;
    values: Record<string, number>;
}) {
    const configs: Record<Kind, Array<[string, string, any]>> = {
        assets: [
            ["total", "Total Unit", Boxes],
            ["available", "Tersedia", PackageCheck],
            ["borrowed", "Dipinjam", Boxes],
            ["maintenance", "Perawatan", Wrench],
            ["lost_or_damaged", "Rusak / Hilang", ShieldAlert],
        ],
        loans: [
            ["total", "Total Transaksi", ClipboardList],
            ["active", "Aktif", Boxes],
            ["overdue", "Terlambat", ShieldAlert],
            ["completed", "Selesai", PackageCheck],
        ],
        audits: [
            ["total", "Total Audit", ScanLine],
            ["completed", "Selesai", PackageCheck],
            ["in_progress", "Berjalan", ClipboardList],
            ["units_checked", "Unit Diperiksa", Boxes],
        ],
        "active-users": [
            ["users", "Pengguna", Users],
            ["transactions", "Transaksi Aktif", ClipboardList],
            ["units", "Unit Dipegang", Boxes],
            ["overdue", "Terlambat", ShieldAlert],
        ],
        "borrowed-items": [
            ["types", "Jenis Alat", ListTree],
            ["units", "Unit Dipinjam", Boxes],
            ["overdue", "Terlambat", ShieldAlert],
        ],
    };
    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {configs[kind].map(([key, label, Icon]) => (
                <Panel key={key} className="p-4">
                    <Icon className="text-green" size={19} />
                    <p className="mt-4 font-num text-3xl font-semibold">
                        {values[key] ?? 0}
                    </p>
                    <p className="text-xs font-semibold text-muted">{label}</p>
                </Panel>
            ))}
        </div>
    );
}

function AssetInsights({
    byStatus,
}: {
    byStatus: Array<{ status: string; total: number }>;
}) {
    const max = Math.max(1, ...byStatus.map((row) => Number(row.total)));
    return (
        <Panel className="mt-5 p-5">
            <p className="label">Distribusi kondisi</p>
            <h2 className="font-display text-2xl font-bold">Status Unit</h2>
            <div className="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2">
                {byStatus.map((row) => (
                    <div
                        key={row.status}
                        className="grid grid-cols-[130px_1fr_40px] items-center gap-3"
                    >
                        <StatusBadge status={row.status} />
                        <div className="h-2 bg-line">
                            <div
                                className="h-full bg-green"
                                style={{
                                    width: `${(Number(row.total) / max) * 100}%`,
                                }}
                            />
                        </div>
                        <span className="font-num text-right text-sm font-bold">
                            {row.total}
                        </span>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function LoanInsights({
    byStatus,
    monthly,
}: {
    byStatus: Array<{ status: string; total: number }>;
    monthly: Array<{ period: string; total: number }>;
}) {
    const max = Math.max(1, ...monthly.map((row) => Number(row.total)));
    return (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <Panel className="p-5">
                <p className="label">Distribusi transaksi</p>
                <h2 className="font-display text-2xl font-bold">
                    Status Peminjaman
                </h2>
                <div className="mt-5 flex flex-wrap gap-3">
                    {byStatus.map((row) => (
                        <div
                            key={row.status}
                            className="flex items-center gap-2"
                        >
                            <StatusBadge status={row.status} />
                            <span className="font-num text-sm font-bold">
                                {row.total}
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
                <div className="mt-5 flex h-40 items-end gap-2 border-b border-l px-3 pt-3">
                    {monthly.slice(-12).map((row) => (
                        <div
                            key={row.period}
                            className="flex h-full min-w-5 flex-1 flex-col justify-end text-center"
                        >
                            <span className="mb-1 font-num text-[10px] font-bold">
                                {row.total}
                            </span>
                            <div
                                className="mx-auto w-full max-w-12 bg-amber"
                                style={{
                                    height: `${Math.max(6, (Number(row.total) / max) * 100)}px`,
                                }}
                            />
                            <span className="mt-1 truncate text-[8px] text-muted">
                                {row.period.slice(5)}
                            </span>
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    );
}

function ReportRows({ kind, rows }: { kind: Kind; rows: any[] }) {
    if (!rows.length)
        return (
            <EmptyState
                title="Tidak ada data laporan"
                description="Ubah pencarian atau periksa kembali saat data sudah tersedia."
            />
        );
    if (kind === "borrowed-items") return <BorrowedItemRows rows={rows} />;
    const columns: Record<Exclude<Kind, "borrowed-items">, Column[]> = {
        assets: [
            [
                "Kode Aset",
                (r) => (
                    <span className="font-num font-bold text-green">
                        {r.asset_code}
                    </span>
                ),
            ],
            [
                "Jenis Alat",
                (r) => (
                    <>
                        <strong>{r.tool_type?.name}</strong>
                        <small className="block font-num text-muted">
                            {r.tool_type?.code}
                        </small>
                    </>
                ),
            ],
            ["Status", (r) => <StatusBadge status={r.status} />],
            [
                "Kondisi",
                (r) => (
                    <span className="capitalize">
                        {r.condition?.replaceAll("_", " ")}
                    </span>
                ),
            ],
            ["Lokasi", (r) => r.location?.name ?? "—"],
            ["Owner", (r) => r.owner ?? "—"],
        ],
        loans: [
            [
                "Transaksi",
                (r) => (
                    <Link
                        href={`/peminjaman/${r.id}`}
                        className="font-num font-bold text-green hover:underline"
                    >
                        {r.trx_no}
                    </Link>
                ),
            ],
            [
                "Peminjam",
                (r) => (
                    <>
                        <strong>{r.borrower?.name ?? "—"}</strong>
                        <small className="block text-muted">
                            {r.borrower?.institution ?? "Tanpa institusi"}
                        </small>
                    </>
                ),
            ],
            [
                "Penggunaan",
                (r) => (
                    <span className="capitalize">
                        {r.usage_type?.replaceAll("_", " ")}
                    </span>
                ),
            ],
            ["Mulai", (r) => formatDate(r.start_date)],
            ["Tenggat", (r) => formatDate(r.due_date)],
            [
                "Unit",
                (r) => (
                    <span className="font-num font-bold">
                        {r.items?.length ?? 0}
                    </span>
                ),
            ],
            ["Status", (r) => <StatusBadge status={r.status} />],
        ],
        audits: [
            ["Audit", (r) => <strong>{r.name}</strong>],
            ["Cakupan", (r) => r.scope],
            ["Jadwal", (r) => formatDate(r.scheduled_date)],
            [
                "Progres",
                (r) => (
                    <Progress checked={r.checked_units} total={r.total_units} />
                ),
            ],
            ["Status", (r) => <StatusBadge status={r.status} />],
            ["Catatan", (r) => r.reviewer_note ?? "—"],
        ],
        "active-users": [
            [
                "Peminjam",
                (r) => (
                    <>
                        <strong>{r.borrower?.name ?? "—"}</strong>
                        <small className="block text-muted">
                            {r.borrower?.institution ?? "Tanpa institusi"}
                        </small>
                    </>
                ),
            ],
            [
                "Transaksi",
                (r) => (
                    <Link
                        href={`/peminjaman/${r.id}`}
                        className="font-num font-bold text-green hover:underline"
                    >
                        {r.trx_no}
                    </Link>
                ),
            ],
            [
                "Item Aktif",
                (r) => (
                    <div className="space-y-1">
                        {r.items.map((item: any) => (
                            <p key={item.id} className="text-xs">
                                <strong>{item.name}</strong>{" "}
                                <span className="font-num text-muted">
                                    {item.asset_code}
                                </span>
                            </p>
                        ))}
                    </div>
                ),
            ],
            ["Lokasi", (r) => r.location_text],
            ["Tenggat", (r) => formatDate(r.due_date)],
            ["Status", (r) => <StatusBadge status={r.status} />],
        ],
    };
    const selected = columns[kind];
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-canvas text-[10px] uppercase tracking-wider text-muted">
                    <tr>
                        {selected.map(([label]) => (
                            <th key={label} className="p-4">
                                {label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr
                            key={row.id ?? index}
                            className="border-b border-line align-top last:border-0 hover:bg-canvas/55"
                        >
                            {selected.map(([label, render]) => (
                                <td key={label} className="p-4">
                                    {render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Progress({ checked, total }: { checked: number; total: number }) {
    const percent = total ? Math.round((checked / total) * 100) : 0;
    return (
        <div className="min-w-32">
            <div className="mb-1 flex justify-between font-num text-[10px]">
                <span>
                    {checked}/{total}
                </span>
                <span>{percent}%</span>
            </div>
            <div className="h-2 bg-line">
                <div
                    className="h-full bg-green"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

function BorrowedItemRows({ rows }: { rows: any[] }) {
    return (
        <div className="divide-y divide-line">
            {rows.map((row) => (
                <div
                    key={row.tool_type_id}
                    className="grid gap-4 p-5 lg:grid-cols-[240px_90px_1fr]"
                >
                    <div>
                        <p className="font-num text-[10px] font-bold text-green">
                            {row.code}
                        </p>
                        <h3 className="mt-1 font-display text-xl font-bold">
                            {row.name}
                        </h3>
                    </div>
                    <div className="rounded-md bg-amber/15 p-3 text-center">
                        <p className="font-num text-2xl font-bold">
                            {row.total_borrowed}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                            Dipinjam
                        </p>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                        {row.units.map((unit: any) => (
                            <div
                                key={`${unit.loan_id}-${unit.asset_code}`}
                                className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-line bg-canvas/55 p-3"
                            >
                                <div>
                                    <p className="font-num text-xs font-bold">
                                        {unit.asset_code ?? "—"}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        {unit.borrower_name ?? "—"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Link
                                        href={`/peminjaman/${unit.loan_id}`}
                                        className="font-num text-[10px] font-bold text-green hover:underline"
                                    >
                                        {unit.trx_no}
                                    </Link>
                                    <p className="mt-1 text-[10px] text-muted">
                                        {formatDate(unit.due_date)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
