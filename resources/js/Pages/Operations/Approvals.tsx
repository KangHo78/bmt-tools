import { Head, Link, router } from "@inertiajs/react";
import { CalendarPlus, Check, CheckSquare, FileText, X } from "lucide-react";
import TamsLayout from "@/Layouts/TamsLayout";
import {
    EmptyState,
    PageHeader,
    Panel,
    StatusBadge,
} from "@/Components/TamsUI";
import { formatDate } from "@/lib/ui";
import type { Loan } from "@/types/tams";

export default function Approvals({
    loans,
    extensions = [],
}: {
    loans: Loan[];
    extensions: any[];
}) {
    return (
        <TamsLayout>
            <Head title="Approval" />
            <PageHeader
                eyebrow="Decision queue"
                title="Approval Logistik"
                description="Approval final setelah seluruh owner item menyetujui permohonan."
            />
            <section>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold">
                        Persetujuan Final Peminjaman
                    </h2>
                    <span className="font-num text-sm text-muted">
                        {loans.length} antrean
                    </span>
                </div>
                {loans.length ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {loans.map((loan) => (
                            <Panel key={loan.id} className="overflow-hidden">
                                <div className="hazard-stripe h-2" />
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-num text-xs font-bold text-muted">
                                                {loan.trx_no}
                                            </p>
                                            <h3 className="mt-1 font-display text-2xl font-bold">
                                                {loan.borrower.name}
                                            </h3>
                                            <p className="text-xs text-muted">
                                                {loan.borrower.institution}
                                            </p>
                                        </div>
                                        <StatusBadge status={loan.status} />
                                    </div>
                                    <p className="mt-4 text-sm font-semibold">
                                        {loan.purpose}
                                    </p>
                                    <dl className="mt-4 grid grid-cols-2 gap-3 rounded bg-canvas p-3 text-xs">
                                        <div>
                                            <dt className="text-muted">
                                                Periode
                                            </dt>
                                            <dd className="mt-1 font-semibold">
                                                {formatDate(loan.start_date)} –{" "}
                                                {formatDate(loan.due_date)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted">
                                                Token
                                            </dt>
                                            <dd className="mt-1 font-semibold">
                                                {loan.tokens_used} jenis alat
                                            </dd>
                                        </div>
                                    </dl>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {loan.letter_url && (
                                            <a
                                                target="_blank"
                                                href={
                                                    loan.letter_url.startsWith(
                                                        "/",
                                                    )
                                                        ? loan.letter_url
                                                        : `/storage/${loan.letter_url}`
                                                }
                                                className="btn-secondary"
                                            >
                                                <FileText size={17} />
                                                Lihat Surat
                                            </a>
                                        )}
                                        <Link
                                            href={`/peminjaman/${loan.id}`}
                                            className="btn-primary ml-auto"
                                        >
                                            <CheckSquare size={17} />
                                            Review Keputusan
                                        </Link>
                                    </div>
                                </div>
                            </Panel>
                        ))}
                    </div>
                ) : (
                    <Panel>
                        <EmptyState title="Tidak ada approval pinjaman" />
                    </Panel>
                )}
            </section>
            <section className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold">
                        Perpanjangan Luar Area
                    </h2>
                    <span className="font-num text-sm text-muted">
                        {extensions.length} antrean
                    </span>
                </div>
                <Panel className="overflow-hidden">
                    {extensions.length ? (
                        extensions.map((e) => (
                            <div
                                key={e.id}
                                className="grid gap-3 border-b p-4 last:border-0 md:grid-cols-[1fr_160px_1fr_auto] md:items-center"
                            >
                                <div>
                                    <p className="font-num text-xs font-bold">
                                        {e.loan.trx_no}
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {e.loan.borrower.name}
                                    </p>
                                    <p className="text-xs text-muted">
                                        Diajukan oleh {e.requester.name}
                                    </p>
                                </div>
                                <div className="text-xs">
                                    <p className="text-muted">Tenggat lama</p>
                                    <p className="font-semibold">
                                        {formatDate(e.old_due_date)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted">
                                        Tenggat baru:{" "}
                                        <strong className="text-ink">
                                            {formatDate(e.new_due_date)}
                                        </strong>
                                    </p>
                                    <p className="mt-1 text-sm">{e.reason}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            router.post(
                                                `/perpanjangan/${e.id}/setujui`,
                                            )
                                        }
                                        className="btn-primary !min-h-9 !px-3"
                                    >
                                        <Check size={15} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const reason =
                                                window.prompt(
                                                    "Alasan penolakan:",
                                                );
                                            if (reason)
                                                router.post(
                                                    `/perpanjangan/${e.id}/tolak`,
                                                    { reason },
                                                );
                                        }}
                                        className="btn-danger !min-h-9 !px-3"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <EmptyState title="Tidak ada permohonan perpanjangan" />
                    )}
                </Panel>
            </section>
        </TamsLayout>
    );
}
