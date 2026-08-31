import { Head, Link } from "@inertiajs/react";
import {
    Boxes,
    Download,
    ListTree,
    PackageCheck,
    Printer,
    Search,
    ShieldAlert,
    UserRound,
    Users,
    Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import { PageHeader, Panel, StatusBadge } from "@/Components/TamsUI";
import { formatDate } from "@/lib/ui";

type ActiveUsage = {
    id: number;
    trx_no: string;
    borrower?: { id: number; name: string; institution?: string };
    usage_type: string;
    location_text: string;
    due_date: string;
    status: string;
    items: Array<{
        id: number;
        name: string;
        code: string;
        asset_code?: string;
    }>;
};

type BorrowedItem = {
    tool_type_id: number;
    name: string;
    code: string;
    total_borrowed: number;
    units: Array<{
        asset_code?: string;
        loan_id: number;
        trx_no: string;
        borrower_name?: string;
        due_date: string;
        status: string;
    }>;
};

export default function Reports({
    summary,
    byStatus,
    monthlyLoans,
    activeUsage,
    borrowedByItem,
}: {
    summary: Record<string, number>;
    byStatus: any[];
    monthlyLoans: any[];
    activeUsage: ActiveUsage[];
    borrowedByItem: BorrowedItem[];
}) {
    const max = Math.max(1, ...byStatus.map((x) => Number(x.total)));
    const [detailView, setDetailView] = useState<"users" | "items">("users");
    const [query, setQuery] = useState("");
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    const filteredUsers = useMemo(
        () =>
            activeUsage.filter((row) =>
                `${row.borrower?.name ?? ""} ${row.borrower?.institution ?? ""} ${row.trx_no} ${row.items.map((item) => `${item.code} ${item.name} ${item.asset_code ?? ""}`).join(" ")}`
                    .toLocaleLowerCase("id-ID")
                    .includes(normalizedQuery),
            ),
        [activeUsage, normalizedQuery],
    );
    const filteredItems = useMemo(
        () =>
            borrowedByItem.filter((row) =>
                `${row.code} ${row.name} ${row.units.map((unit) => `${unit.asset_code ?? ""} ${unit.borrower_name ?? ""} ${unit.trx_no}`).join(" ")}`
                    .toLocaleLowerCase("id-ID")
                    .includes(normalizedQuery),
            ),
        [borrowedByItem, normalizedQuery],
    );
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
                        <a
                            href="/laporan/ekspor/active-users"
                            className="btn-secondary"
                        >
                            <Download size={16} />
                            Pengguna Aktif CSV
                        </a>
                        <a
                            href="/laporan/ekspor/borrowed-items"
                            className="btn-secondary"
                        >
                            <Download size={16} />
                            Item Dipinjam CSV
                        </a>
                    </div>
                }
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
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
                <Metric
                    value={summary.active_users}
                    label="Pengguna Aktif"
                    icon={Users}
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
            <Panel className="mt-5 overflow-hidden">
                <div className="border-b border-line bg-ink p-5 text-white">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="font-num text-[10px] font-bold uppercase tracking-[.18em] text-amber">
                                Live circulation register
                            </p>
                            <h2 className="mt-1 font-display text-3xl font-bold">
                                Detail Penggunaan Aktif
                            </h2>
                            <p className="mt-1 text-sm text-white/60">
                                Hanya menampilkan unit yang belum dikembalikan.
                            </p>
                        </div>
                        <div className="relative w-full lg:max-w-sm">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
                                size={16}
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Cari user, transaksi, kode, atau item..."
                                className="control border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/40"
                            />
                        </div>
                    </div>
                    <div className="mt-5 flex gap-2">
                        <DetailTab
                            active={detailView === "users"}
                            onClick={() => setDetailView("users")}
                            icon={UserRound}
                            label="Berdasarkan Pengguna"
                            count={activeUsage.length}
                        />
                        <DetailTab
                            active={detailView === "items"}
                            onClick={() => setDetailView("items")}
                            icon={ListTree}
                            label="Berdasarkan Item"
                            count={borrowedByItem.length}
                        />
                    </div>
                </div>
                {detailView === "users" ? (
                    <UsersReport rows={filteredUsers} />
                ) : (
                    <ItemsReport rows={filteredItems} />
                )}
            </Panel>
        </TamsLayout>
    );
}

function DetailTab({ active, onClick, icon: Icon, label, count }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold transition ${active ? "border-amber bg-amber text-ink" : "border-white/20 text-white/65 hover:bg-white/10 hover:text-white"}`}
        >
            <Icon size={15} />
            {label}
            <span className="font-num">{count}</span>
        </button>
    );
}

function UsersReport({ rows }: { rows: ActiveUsage[] }) {
    if (!rows.length) return <ReportEmpty />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b bg-canvas text-[10px] uppercase tracking-wider text-muted">
                    <tr>
                        <th className="p-4">Peminjam</th>
                        <th className="p-4">Transaksi</th>
                        <th className="p-4">Item yang digunakan</th>
                        <th className="p-4">Lokasi</th>
                        <th className="p-4">Tenggat</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.id}
                            className="border-b border-line align-top last:border-0 hover:bg-canvas/55"
                        >
                            <td className="p-4">
                                <strong>{row.borrower?.name ?? "—"}</strong>
                                <small className="mt-1 block text-muted">
                                    {row.borrower?.institution ||
                                        "Tanpa institusi"}
                                </small>
                            </td>
                            <td className="p-4">
                                <Link
                                    href={`/peminjaman/${row.id}`}
                                    className="font-num font-bold text-green hover:underline"
                                >
                                    {row.trx_no}
                                </Link>
                                <small className="mt-1 block capitalize text-muted">
                                    {row.usage_type.replaceAll("_", " ")}
                                </small>
                            </td>
                            <td className="p-4">
                                <div className="space-y-1.5">
                                    {row.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded border border-line bg-canvas/55 px-2.5 py-2"
                                        >
                                            <strong className="text-xs">
                                                {item.name}
                                            </strong>
                                            <span className="ml-2 font-num text-[10px] text-muted">
                                                {item.code} · {item.asset_code}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </td>
                            <td className="p-4 text-xs">{row.location_text}</td>
                            <td className="p-4 font-semibold">
                                {formatDate(row.due_date)}
                            </td>
                            <td className="p-4">
                                <StatusBadge status={row.status} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ItemsReport({ rows }: { rows: BorrowedItem[] }) {
    if (!rows.length) return <ReportEmpty />;
    return (
        <div className="divide-y divide-line">
            {rows.map((row) => (
                <div
                    key={row.tool_type_id}
                    className="grid gap-4 p-5 lg:grid-cols-[240px_90px_1fr] lg:items-start"
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
                        {row.units.map((unit) => (
                            <div
                                key={`${unit.loan_id}-${unit.asset_code}`}
                                className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-line bg-canvas/55 p-3"
                            >
                                <div>
                                    <p className="font-num text-xs font-bold">
                                        {unit.asset_code}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        {unit.borrower_name || "—"}
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

function ReportEmpty() {
    return (
        <div className="p-12 text-center">
            <PackageCheck className="mx-auto text-muted" />
            <p className="mt-3 font-display text-xl font-bold">
                Tidak ada penggunaan aktif
            </p>
            <p className="mt-1 text-sm text-muted">
                Ubah pencarian atau periksa kembali saat ada unit dipinjam.
            </p>
        </div>
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
