import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import TamsLayout from "@/Layouts/TamsLayout";
import { PageHeader, Panel, StatusBadge } from "@/Components/TamsUI";
import { formatDate } from "@/lib/ui";

export default function ReceiptShow({ receipt }: { receipt: any }) {
    const total = receipt.items.reduce(
        (n: number, x: any) => n + x.received_quantity,
        0,
    );
    return (
        <TamsLayout>
            <Head title={receipt.reference_no} />
            <Link
                href="/inventaris"
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted"
            >
                <ArrowLeft size={16} />
                Inventaris
            </Link>
            <PageHeader
                eyebrow="Receiving record"
                title={receipt.reference_no}
                description={`${total} unit diterima dari ${receipt.owner_institution}`}
                action={
                    <Link
                        href={`/inventaris/penerimaan/${receipt.id}/label`}
                        className="btn-primary"
                    >
                        <Printer size={17} />
                        Cetak {total} Label
                    </Link>
                }
            />
            <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                <Panel className="overflow-hidden">
                    <div className="border-b p-5">
                        <h2 className="font-display text-2xl font-bold">
                            Unit yang Dibuat
                        </h2>
                    </div>
                    {receipt.items.map((item: any) => (
                        <div
                            key={item.id}
                            className="border-b p-5 last:border-0"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-num text-xs font-bold text-green">
                                        {item.tool_type.code}
                                    </p>
                                    <h3 className="font-display text-2xl font-bold">
                                        {item.tool_type.name}
                                    </h3>
                                    <p className="mt-1 text-xs text-muted">
                                        {item.received_quantity}/
                                        {item.requested_quantity} diterima ·{" "}
                                        {item.location.name}
                                    </p>
                                </div>
                                <StatusBadge
                                    status={
                                        item.initial_condition === "rusak"
                                            ? "rusak"
                                            : "tersedia"
                                    }
                                />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {item.units.map((u: any) => (
                                    <span
                                        key={u.id}
                                        className="rounded border bg-canvas px-2 py-1 font-num text-[10px] font-bold"
                                    >
                                        {u.asset_code}
                                    </span>
                                ))}
                            </div>
                            {item.difference_reason && (
                                <p className="mt-3 rounded border border-amber/40 bg-amber/10 p-2 text-xs">
                                    Selisih: {item.difference_reason}
                                </p>
                            )}
                        </div>
                    ))}
                </Panel>
                <Panel className="h-fit p-5">
                    <p className="label">Metadata</p>
                    <dl className="space-y-4">
                        <Meta
                            label="Tanggal masuk"
                            value={formatDate(receipt.received_date)}
                        />
                        <Meta label="Petugas" value={receipt.receiver.name} />
                        <Meta
                            label="Referensi permohonan"
                            value={receipt.request_reference ?? "—"}
                        />
                        <Meta label="Status" value={receipt.status} />
                    </dl>
                    {receipt.document_url && (
                        <a
                            href={`/storage/${receipt.document_url}`}
                            target="_blank"
                            className="btn-secondary mt-5 w-full"
                        >
                            <FileText size={17} />
                            Dokumen Pendukung
                        </a>
                    )}
                </Panel>
            </div>
        </TamsLayout>
    );
}
function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {label}
            </dt>
            <dd className="mt-1 text-sm font-semibold capitalize">{value}</dd>
        </div>
    );
}
