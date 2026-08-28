import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowLeft,
    BellRing,
    CalendarPlus,
    Check,
    ClipboardCheck,
    FileText,
    MapPin,
    PackageCheck,
    UserRound,
    X,
} from "lucide-react";
import { useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import { PageHeader, Panel, StatusBadge } from "@/Components/TamsUI";
import { formatDate, formatDateTime } from "@/lib/ui";
import type { Loan, PageProps } from "@/types/tams";

export default function Show({
    loan,
    canActOnApproval = false,
}: {
    loan: Loan;
    canActOnApproval?: boolean;
}) {
    const { user } = usePage<PageProps>().props.auth;
    const [reject, setReject] = useState(false);
    const [extend, setExtend] = useState(false);
    const rejectForm = useForm({ reason: "" });
    const extendForm = useForm({ new_due_date: "", reason: "" });
    const canApprove = canActOnApproval && loan.status === "menunggu_approval";
    const canOperate = ["petugas", "admin"].includes(user.role);
    const active = ["berjalan", "terlambat", "menunggu_inspeksi"].includes(
        loan.status,
    );
    return (
        <TamsLayout>
            <Head title={loan.trx_no} />
            <Link
                href="/peminjaman"
                className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
            >
                <ArrowLeft size={16} />
                Daftar peminjaman
            </Link>
            <PageHeader
                eyebrow="Loan passport"
                title={loan.trx_no}
                description={`${loan.usage_type === "luar_area" ? "Penggunaan luar area" : "Penggunaan dalam area"} · dibuat ${formatDate(loan.created_at)}`}
                action={<StatusBadge status={loan.status} />}
            />
            <div
                className={`mb-5 rounded-lg border p-5 ${loan.status === "terlambat" ? "border-red bg-red/10" : "border-amber/50 bg-amber/10"}`}
            >
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {loan.status === "terlambat" ? (
                            <AlertTriangle className="text-red" />
                        ) : (
                            <ClipboardCheck className="text-amber-ink" />
                        )}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                Tenggat pengembalian
                            </p>
                            <p className="font-display text-3xl font-bold">
                                {formatDate(loan.due_date)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canApprove && (
                            <>
                                <button
                                    onClick={() =>
                                        router.post(
                                            `/peminjaman/${loan.id}/setujui`,
                                        )
                                    }
                                    className="btn-primary"
                                >
                                    <Check size={17} />
                                    Setujui
                                </button>
                                <button
                                    onClick={() => setReject(true)}
                                    className="btn-danger"
                                >
                                    <X size={17} />
                                    Tolak
                                </button>
                            </>
                        )}
                        {canOperate &&
                            ["disetujui", "menunggu_serah_terima"].includes(
                                loan.status,
                            ) && (
                                <Link
                                    href={`/serah-terima/${loan.id}`}
                                    className="btn-primary"
                                >
                                    <PackageCheck size={17} />
                                    Mulai Serah Terima
                                </Link>
                            )}
                        {canOperate && active && (
                            <Link
                                href={`/pengembalian/${loan.id}`}
                                className="btn-primary"
                            >
                                <ClipboardCheck size={17} />
                                Proses Pengembalian
                            </Link>
                        )}
                        {user.role !== "user" && active && (
                            <button
                                onClick={() =>
                                    router.post(
                                        `/peminjaman/${loan.id}/ingatkan`,
                                    )
                                }
                                className="btn-secondary"
                            >
                                <BellRing size={17} />
                                Ingatkan
                            </button>
                        )}
                        {active && (
                            <button
                                onClick={() => setExtend(true)}
                                className="btn-secondary"
                            >
                                <CalendarPlus size={17} />
                                Perpanjang
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
                <div className="space-y-5">
                    <Panel className="overflow-hidden">
                        <div className="border-b p-5">
                            <p className="label">Manifest alat</p>
                            <h2 className="font-display text-2xl font-bold">
                                {loan.items.length} Jenis Alat ·{" "}
                                {loan.tokens_used} Token
                            </h2>
                        </div>
                        {loan.items.map((item) => (
                            <div
                                key={item.id}
                                className="grid gap-3 border-b p-4 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center"
                            >
                                <div>
                                    <p className="font-display text-xl font-bold">
                                        {item.tool_type.name}
                                    </p>
                                    <p className="font-num text-xs text-muted">
                                        {item.unit?.asset_code ??
                                            "Unit ditentukan saat serah terima"}
                                    </p>
                                    {item.physical_token && (
                                        <p className="mt-1 inline-flex rounded bg-amber/15 px-2 py-1 font-num text-xs font-bold">
                                            Token {item.physical_token.code}
                                        </p>
                                    )}
                                </div>
                                <StatusBadge
                                    status={
                                        item.return_status === "belum_dicek"
                                            ? item.unit
                                                ? "dipinjam"
                                                : "direservasi"
                                            : item.return_status
                                    }
                                />
                            </div>
                        ))}
                    </Panel>
                    <Panel className="p-5">
                        <p className="label">Tujuan pekerjaan</p>
                        <h2 className="font-display text-2xl font-bold">
                            {loan.purpose}
                        </h2>
                        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                            <MapPin size={17} />
                            {loan.location_text}
                        </p>
                    </Panel>
                    {(loan.extensions?.length ?? 0) > 0 && (
                        <Panel className="p-5">
                            <p className="label">Riwayat perpanjangan</p>
                            <div className="space-y-3">
                                {loan.extensions?.map((extension: any) => (
                                    <div
                                        key={extension.id}
                                        className="rounded border bg-canvas/50 p-3"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold">
                                                {formatDate(
                                                    extension.old_due_date,
                                                )}{" "}
                                                →{" "}
                                                {formatDate(
                                                    extension.new_due_date,
                                                )}
                                            </span>
                                            <StatusBadge
                                                status={extension.status}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-muted">
                                            {extension.reason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    )}
                </div>
                <div className="space-y-5">
                    <Panel className="p-5">
                        <p className="label">Peminjam</p>
                        <div className="mt-3 flex items-center gap-3">
                            <div className="grid size-11 place-items-center rounded bg-ink font-display text-xl font-bold text-white">
                                {loan.borrower.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold">
                                    {loan.borrower.name}
                                </p>
                                <p className="text-xs text-muted">
                                    {loan.borrower.institution}
                                </p>
                            </div>
                        </div>
                        <dl className="mt-5 space-y-3 border-t pt-4">
                            <Meta
                                icon={UserRound}
                                label="Kontak"
                                value={
                                    loan.borrower.phone ??
                                    loan.borrower.user?.email ??
                                    "Tanpa akun"
                                }
                            />
                            <Meta
                                icon={MapPin}
                                label="Area penggunaan"
                                value={
                                    loan.usage_type === "luar_area"
                                        ? "Luar Workshop"
                                        : "Dalam Workshop"
                                }
                            />
                            <Meta
                                icon={ClipboardCheck}
                                label="Serah terima"
                                value={formatDateTime(loan.handover_at)}
                            />
                        </dl>
                    </Panel>
                    <Panel className="p-5">
                        <p className="label">Dokumen & persetujuan</p>
                        {loan.letter_url ? (
                            <a
                                href={
                                    loan.letter_url.startsWith("/")
                                        ? loan.letter_url
                                        : `/storage/${loan.letter_url}`
                                }
                                target="_blank"
                                className="btn-secondary mt-2 w-full"
                            >
                                <FileText size={17} />
                                Buka Surat Permohonan
                            </a>
                        ) : (
                            <p className="mt-2 text-sm text-muted">
                                Surat tidak diperlukan untuk penggunaan dalam
                                area.
                            </p>
                        )}
                        <div className="mt-4 space-y-2 border-t pt-4">
                            {(loan.approvals ?? []).map((approval) => (
                                <div
                                    key={approval.id}
                                    className="flex items-center justify-between gap-3 text-xs"
                                >
                                    <span className="font-semibold">
                                        {approval.type === "owner"
                                            ? `Owner item${approval.required_approver ? ` · ${approval.required_approver.name}` : ""}`
                                            : "Kepala Logistik"}
                                    </span>
                                    <span className="text-muted">
                                        {approval.status.replaceAll("_", " ")}
                                        {approval.approver
                                            ? ` · ${approval.approver.name}`
                                            : ""}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {loan.approver && (
                            <p className="mt-4 border-t pt-4 text-xs text-muted">
                                Disetujui oleh{" "}
                                <strong className="text-ink">
                                    {loan.approver.name}
                                </strong>
                            </p>
                        )}
                        {loan.rejection_reason && (
                            <div className="mt-4 rounded border border-red/30 bg-red/10 p-3 text-sm text-red">
                                <strong>Alasan penolakan:</strong>
                                <br />
                                {loan.rejection_reason}
                            </div>
                        )}
                    </Panel>
                </div>
            </div>
            {reject && (
                <Modal title="Tolak Permohonan" close={() => setReject(false)}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            rejectForm.post(`/peminjaman/${loan.id}/tolak`, {
                                onSuccess: () => setReject(false),
                            });
                        }}
                    >
                        <label className="label">Alasan wajib</label>
                        <textarea
                            className="control min-h-28"
                            value={rejectForm.data.reason}
                            onChange={(e) =>
                                rejectForm.setData("reason", e.target.value)
                            }
                        />
                        {rejectForm.errors.reason && (
                            <p className="mt-1 text-xs text-red">
                                {rejectForm.errors.reason}
                            </p>
                        )}
                        <button
                            disabled={rejectForm.processing}
                            className="btn-danger mt-4 w-full"
                        >
                            Tolak dan Lepas Token
                        </button>
                    </form>
                </Modal>
            )}
            {extend && (
                <Modal
                    title="Perpanjang Tenggat"
                    close={() => setExtend(false)}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            extendForm.post(
                                `/peminjaman/${loan.id}/perpanjang`,
                                { onSuccess: () => setExtend(false) },
                            );
                        }}
                        className="space-y-4"
                    >
                        <label>
                            <span className="label">Tenggat baru</span>
                            <input
                                type="date"
                                className="control"
                                value={extendForm.data.new_due_date}
                                onChange={(e) =>
                                    extendForm.setData(
                                        "new_due_date",
                                        e.target.value,
                                    )
                                }
                            />
                        </label>
                        <label>
                            <span className="label">Alasan</span>
                            <textarea
                                className="control min-h-24"
                                value={extendForm.data.reason}
                                onChange={(e) =>
                                    extendForm.setData("reason", e.target.value)
                                }
                            />
                        </label>
                        <button
                            disabled={extendForm.processing}
                            className="btn-primary w-full"
                        >
                            Simpan Perpanjangan
                        </button>
                    </form>
                </Modal>
            )}
        </TamsLayout>
    );
}
function Meta({
    icon: Icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <Icon size={17} className="mt-0.5 text-muted" />
            <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
            </div>
        </div>
    );
}
function Modal({
    title,
    close,
    children,
}: {
    title: string;
    close: () => void;
    children: any;
}) {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4">
            <Panel className="w-full max-w-lg p-5">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="font-display text-3xl font-bold">{title}</h2>
                    <button onClick={close}>
                        <X />
                    </button>
                </div>
                {children}
            </Panel>
        </div>
    );
}
