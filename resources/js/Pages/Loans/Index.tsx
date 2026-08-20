import { Head, Link, router } from "@inertiajs/react";
import { Plus } from "lucide-react";
import TamsLayout from "@/Layouts/TamsLayout";
import {
    EmptyState,
    PageHeader,
    Pagination,
    Panel,
    RowLink,
    StatusBadge,
} from "@/Components/TamsUI";
import { formatDate } from "@/lib/ui";
import type { Loan } from "@/types/tams";

export default function Index({
    loans,
    filters,
}: {
    loans: { data: Loan[]; links: any[] };
    filters: { status?: string };
}) {
    return (
        <TamsLayout>
            <Head title="Peminjaman" />
            <PageHeader
                eyebrow="Loan register"
                title="Peminjaman"
                description="Seluruh permohonan, pinjaman aktif, dan histori pengembalian."
                action={
                    <Link href="/peminjaman/baru" className="btn-primary">
                        <Plus size={17} />
                        Pinjaman Baru
                    </Link>
                }
            />
            <div className="mb-4 flex flex-wrap gap-2">
                {[
                    ["", "Semua"],
                    ["menunggu_approval", "Menunggu Approval"],
                    ["berjalan", "Berjalan"],
                    ["terlambat", "Terlambat"],
                    ["selesai", "Selesai"],
                ].map(([value, label]) => (
                    <button
                        key={value}
                        onClick={() =>
                            router.get(
                                "/peminjaman",
                                { status: value },
                                { preserveState: true },
                            )
                        }
                        className={`rounded-full border px-3 py-2 text-xs font-semibold ${(filters.status ?? "") === value ? "border-ink bg-ink text-white" : "bg-surface text-muted hover:border-ink"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <Panel className="overflow-hidden">
                {loans.data.length ? (
                    loans.data.map((loan) => (
                        <RowLink key={loan.id} href={`/peminjaman/${loan.id}`}>
                            <div className="grid gap-2 md:grid-cols-[140px_1fr_180px_160px] md:items-center">
                                <div>
                                    <span className="font-num text-sm font-bold">
                                        {loan.trx_no}
                                    </span>
                                    <p className="text-[10px] uppercase tracking-wider text-muted">
                                        {loan.usage_type === "luar_area"
                                            ? "Luar area"
                                            : "Dalam area"}
                                    </p>
                                </div>
                                <div>
                                    <p className="truncate text-sm font-semibold">
                                        {loan.purpose}
                                    </p>
                                    <p className="text-xs text-muted">
                                        {loan.user?.name} ·{" "}
                                        {loan.items
                                            .map((i) => i.tool_type.name)
                                            .join(", ")}
                                    </p>
                                </div>
                                <div className="text-xs">
                                    <p className="text-muted">Tenggat</p>
                                    <p className="font-semibold">
                                        {formatDate(loan.due_date)}
                                    </p>
                                </div>
                                <StatusBadge status={loan.status} />
                            </div>
                        </RowLink>
                    ))
                ) : (
                    <EmptyState title="Belum ada peminjaman" />
                )}
                <Pagination links={loans.links} />
            </Panel>
        </TamsLayout>
    );
}
