import { Head, Link } from "@inertiajs/react";
import { ClipboardCheck } from "lucide-react";
import TamsLayout from "@/Layouts/TamsLayout";
import {
    EmptyState,
    PageHeader,
    Panel,
    StatusBadge,
} from "@/Components/TamsUI";
import { formatDate } from "@/lib/ui";
import type { Loan } from "@/types/tams";

export default function Returns({ loans }: { loans: Loan[] }) {
    return (
        <TamsLayout>
            <Head title="Pengembalian" />
            <PageHeader
                eyebrow="Inspection queue"
                title="Pengembalian"
                description="Pilih satu atau beberapa unit yang kembali, lalu dokumentasikan kondisi fisiknya bersama peminjam."
            />
            <Panel className="overflow-hidden">
                {loans.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="border-b bg-ink text-[10px] uppercase tracking-wider text-white">
                                <tr>
                                    <th className="p-4">Transaksi</th>
                                    <th className="p-4">Peminjam</th>
                                    <th className="p-4">Alat</th>
                                    <th className="p-4">Tenggat</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loans.map((l) => (
                                    <tr
                                        key={l.id}
                                        className="border-b last:border-0 hover:bg-canvas/60"
                                    >
                                        <td className="p-4 font-num font-bold">
                                            {l.trx_no}
                                        </td>
                                        <td className="p-4">
                                            <p className="font-semibold">
                                                {l.borrower.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {l.borrower.institution}
                                            </p>
                                        </td>
                                        <td className="p-4 text-xs">
                                            <p>
                                                {l.items
                                                    .map(
                                                        (i) => i.tool_type.name,
                                                    )
                                                    .join(", ")}
                                            </p>
                                            <p className="mt-1 font-num text-[10px] font-bold text-green">
                                                {l.items.length} UNIT TERSISA
                                            </p>
                                        </td>
                                        <td className="p-4 font-semibold">
                                            {formatDate(l.due_date)}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={l.status} />
                                        </td>
                                        <td className="p-4">
                                            <Link
                                                href={`/pengembalian/${l.id}`}
                                                className="btn-primary !min-h-9 !px-3"
                                            >
                                                <ClipboardCheck size={15} />
                                                Periksa
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState title="Tidak ada antrean pengembalian" />
                )}
            </Panel>
        </TamsLayout>
    );
}
