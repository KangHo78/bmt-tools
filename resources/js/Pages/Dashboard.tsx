import { Head, Link, usePage } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowRight,
    Boxes,
    CalendarClock,
    CheckSquare,
    ClipboardCheck,
    Clock3,
    Eye,
    Wrench,
} from "lucide-react";
import TamsLayout from "@/Layouts/TamsLayout";
import {
    PageHeader,
    Panel,
    RowLink,
    StatusBadge,
    TokenMeter,
} from "@/Components/TamsUI";
import { formatDate, roleLabels } from "@/lib/ui";
import type { Loan, PageProps } from "@/types/tams";

interface Props {
    metrics: Record<string, number>;
    loans: Loan[];
    pendingApprovals: DashboardApproval[];
    showApprovalQueue: boolean;
    maintenance: any[];
    audit?: any;
}

interface DashboardApproval {
    id: number;
    type: "owner" | "logistik";
    loan: Loan;
}

export default function Dashboard({
    metrics,
    loans,
    pendingApprovals = [],
    showApprovalQueue = false,
    maintenance,
    audit,
}: Props) {
    const { user } = usePage<PageProps>().props.auth;
    const isUser = user.role === "user";
    const isHead = user.role === "kepala_logistik";
    return (
        <TamsLayout>
            <Head title="Ringkasan" />
            <PageHeader
                eyebrow={`Control desk · ${roleLabels[user.role]}`}
                title={`Selamat datang, ${user.name.split(" ")[0]}`}
                description={
                    isUser
                        ? "Pantau token, tenggat, dan status permohonan alat Anda."
                        : "Prioritas operasional dan kondisi aset Workshop Trowulan hari ini."
                }
                action={
                    <Link
                        href={
                            isUser
                                ? "/peminjaman/baru"
                                : isHead
                                  ? "/approval"
                                  : "/pengembalian"
                        }
                        className="btn-primary"
                    >
                        {isUser
                            ? "Ajukan Pinjaman"
                            : isHead
                              ? "Review Approval"
                              : "Proses Pengembalian"}
                        <ArrowRight size={17} />
                    </Link>
                }
            />
            {showApprovalQueue && (
                <ApprovalQueue approvals={pendingApprovals} />
            )}
            {isUser ? (
                <UserBoard user={user} loans={loans} />
            ) : (
                <OperationsBoard
                    metrics={metrics}
                    loans={loans}
                    maintenance={maintenance}
                    audit={audit}
                    isHead={isHead}
                />
            )}
        </TamsLayout>
    );
}

function ApprovalQueue({ approvals }: { approvals: DashboardApproval[] }) {
    return (
        <Panel className="mb-5 overflow-hidden border-t-4 !border-t-amber">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
                <div>
                    <p className="label">Kotak Keputusan</p>
                    <h2 className="font-display text-2xl font-bold">
                        Menunggu Approval
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                        Buka detail transaksi untuk memeriksa data sebelum
                        memberikan keputusan.
                    </p>
                </div>
                <span className="rounded-full bg-amber/15 px-3 py-1 font-num text-sm font-bold text-amber-ink">
                    {approvals.length} antrean
                </span>
            </div>

            <div className="hidden grid-cols-[110px_1fr_1.3fr_150px_130px_32px] gap-4 border-b bg-canvas/70 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted md:grid">
                <span>Transaksi</span>
                <span>Peminjam</span>
                <span>Keperluan & Alat</span>
                <span>Periode</span>
                <span>Tahap</span>
                <span />
            </div>

            {approvals.length ? (
                approvals.map((approval) => {
                    const loan = approval.loan;
                    const toolNames = loan.items
                        .map((item) => item.tool_type.name)
                        .join(" · ");

                    return (
                        <Link
                            key={approval.id}
                            href={`/peminjaman/${loan.id}`}
                            className="group grid gap-3 border-b px-5 py-4 last:border-0 hover:bg-amber/5 md:grid-cols-[110px_1fr_1.3fr_150px_130px_32px] md:items-center md:gap-4"
                        >
                            <div>
                                <span className="font-num text-sm font-bold text-green">
                                    {loan.trx_no}
                                </span>
                                <p className="mt-1 text-[10px] text-muted md:hidden">
                                    Transaksi
                                </p>
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {loan.borrower.name}
                                </p>
                                <p className="truncate text-xs text-muted">
                                    {loan.borrower.institution || "—"}
                                </p>
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {loan.purpose}
                                </p>
                                <p className="truncate text-xs text-muted">
                                    {toolNames}
                                </p>
                            </div>
                            <p className="font-num text-xs text-muted">
                                {formatDate(loan.start_date)} –{" "}
                                {formatDate(loan.due_date)}
                            </p>
                            <div>
                                <span className="inline-flex rounded bg-amber/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-ink">
                                    {approval.type === "owner"
                                        ? "Approval Owner"
                                        : "Approval Logistik"}
                                </span>
                            </div>
                            <Eye
                                size={18}
                                className="text-muted transition group-hover:text-green"
                            />
                        </Link>
                    );
                })
            ) : (
                <div className="p-8 text-center text-sm text-muted">
                    Tidak ada approval yang menunggu keputusan Anda.
                </div>
            )}
        </Panel>
    );
}

function UserBoard({ user, loans }: { user: any; loans: Loan[] }) {
    const active = loans.filter((l) =>
        ["berjalan", "terlambat", "menunggu_inspeksi"].includes(l.status),
    );
    return (
        <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
            <TokenMeter used={user.token_used} total={user.token_quota} />
            <Panel>
                <div className="border-b p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="label">Kewajiban Terdekat</p>
                            <h2 className="font-display text-2xl font-bold">
                                Pinjaman Aktif
                            </h2>
                        </div>
                        <CalendarClock className="text-amber" />
                    </div>
                </div>
                {active.length ? (
                    active.map((l) => (
                        <RowLink key={l.id} href={`/peminjaman/${l.id}`}>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="font-num text-sm font-bold">
                                    {l.trx_no}
                                </span>
                                <StatusBadge status={l.status} />
                                <span className="text-xs text-muted">
                                    Tenggat {formatDate(l.due_date)}
                                </span>
                            </div>
                            <p className="mt-1 truncate text-sm">
                                {l.items
                                    .map((i) => i.tool_type.name)
                                    .join(" · ")}
                            </p>
                        </RowLink>
                    ))
                ) : (
                    <div className="p-8 text-center text-sm text-muted">
                        Tidak ada pinjaman aktif.
                    </div>
                )}
            </Panel>
            <Panel className="xl:col-span-2">
                <div className="flex items-center justify-between border-b p-5">
                    <div>
                        <p className="label">Jejak Permohonan</p>
                        <h2 className="font-display text-2xl font-bold">
                            Aktivitas Terbaru
                        </h2>
                    </div>
                    <Link
                        href="/peminjaman"
                        className="text-sm font-semibold text-green"
                    >
                        Lihat semua
                    </Link>
                </div>
                {loans.map((l) => (
                    <RowLink key={l.id} href={`/peminjaman/${l.id}`}>
                        <div className="flex items-center gap-3">
                            <span className="font-num text-sm font-bold">
                                {l.trx_no}
                            </span>
                            <StatusBadge status={l.status} />
                        </div>
                        <p className="mt-1 text-xs text-muted">
                            {l.purpose} · {formatDate(l.created_at as any)}
                        </p>
                    </RowLink>
                ))}
            </Panel>
        </div>
    );
}

function OperationsBoard({
    metrics,
    loans,
    maintenance,
    audit,
    isHead,
}: {
    metrics: Record<string, number>;
    loans: Loan[];
    maintenance: any[];
    audit?: any;
    isHead: boolean;
}) {
    const cards = isHead
        ? [
              [
                  metrics.pending_approvals,
                  "Menunggu approval",
                  CheckSquare,
                  "amber",
              ],
              [metrics.late_loans, "Pinjaman terlambat", AlertTriangle, "red"],
              [metrics.open_cases, "Kasus terbuka", ClipboardCheck, "red"],
              [metrics.active_loans, "Pinjaman aktif", Clock3, "blue"],
          ]
        : [
              [metrics.available_units, "Unit tersedia", Boxes, "green"],
              [metrics.active_loans, "Pinjaman aktif", Clock3, "blue"],
              [metrics.late_loans, "Terlambat", AlertTriangle, "red"],
              [metrics.maintenance_due, "Perlu servis", Wrench, "amber"],
          ];
    const colors: any = {
        amber: "bg-amber text-amber-ink",
        red: "bg-red text-red",
        green: "bg-green text-green",
        blue: "bg-blue text-blue",
    };
    return (
        <>
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(([value, label, Icon, tone]: any) => (
                    <Panel key={label} className="relative overflow-hidden p-5">
                        <div
                            className={`absolute inset-y-0 left-0 w-1 ${colors[tone].split(" ")[0]}`}
                        />
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-num text-4xl font-semibold">
                                    {value}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-muted">
                                    {label}
                                </p>
                            </div>
                            <Icon
                                className={colors[tone].split(" ")[1]}
                                size={22}
                            />
                        </div>
                    </Panel>
                ))}
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
                <Panel>
                    <div className="flex items-center justify-between border-b p-5">
                        <div>
                            <p className="label">Antrean Prioritas</p>
                            <h2 className="font-display text-2xl font-bold">
                                Transaksi Terkini
                            </h2>
                        </div>
                        <Link
                            href={isHead ? "/approval" : "/peminjaman"}
                            className="text-sm font-semibold text-green"
                        >
                            Buka antrean
                        </Link>
                    </div>
                    {loans.map((l) => (
                        <RowLink key={l.id} href={`/peminjaman/${l.id}`}>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-num text-sm font-bold">
                                    {l.trx_no}
                                </span>
                                <StatusBadge status={l.status} />
                                <span className="ml-auto text-xs text-muted">
                                    {formatDate(l.due_date)}
                                </span>
                            </div>
                            <p className="mt-1 truncate text-sm">
                                {l.borrower?.name} · {l.purpose}
                            </p>
                        </RowLink>
                    ))}
                </Panel>
                <div className="space-y-5">
                    {audit && (
                        <Panel className="overflow-hidden">
                            <div className="hazard-stripe h-2" />
                            <div className="p-5">
                                <p className="label">Audit Berjalan</p>
                                <h3 className="font-display text-2xl font-bold">
                                    {audit.name}
                                </h3>
                                <div className="mt-5 flex items-end justify-between">
                                    <span className="font-num text-3xl font-semibold">
                                        {audit.checked_units}/
                                        {audit.total_units}
                                    </span>
                                    <span className="text-xs text-muted">
                                        {Math.round(
                                            (audit.checked_units /
                                                audit.total_units) *
                                                100,
                                        )}
                                        %
                                    </span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded bg-line">
                                    <div
                                        className="h-full bg-green"
                                        style={{
                                            width: `${(audit.checked_units / audit.total_units) * 100}%`,
                                        }}
                                    />
                                </div>
                                <Link
                                    href="/audit"
                                    className="btn-secondary mt-4 w-full"
                                >
                                    Lanjutkan Audit
                                </Link>
                            </div>
                        </Panel>
                    )}
                    <Panel>
                        <div className="border-b p-4">
                            <p className="label">Pemeliharaan</p>
                            <h3 className="font-display text-xl font-bold">
                                Jadwal Terdekat
                            </h3>
                        </div>
                        {maintenance.slice(0, 3).map((x) => (
                            <div
                                key={x.id}
                                className="border-b p-4 last:border-0"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-num text-xs font-bold">
                                        {x.work_order_no}
                                    </span>
                                    <StatusBadge status={x.status} />
                                </div>
                                <p className="mt-1 text-sm font-semibold">
                                    {x.unit?.tool_type?.name}
                                </p>
                            </div>
                        ))}
                    </Panel>
                </div>
            </div>
        </>
    );
}
