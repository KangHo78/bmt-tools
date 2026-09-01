import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    FileText,
    Pencil,
    Printer,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import { PageHeader, Panel, StatusBadge } from "@/Components/TamsUI";
import { formatDate } from "@/lib/ui";

export default function ReceiptShow({ receipt }: { receipt: any }) {
    const [editing, setEditing] = useState(false);
    const total = receipt.items.reduce(
        (quantity: number, item: any) => quantity + item.received_quantity,
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
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="btn-secondary"
                        >
                            <Pencil size={17} />
                            Ubah Dokumen
                        </button>
                        <Link
                            href={`/inventaris/penerimaan/${receipt.id}/label`}
                            className="btn-primary"
                        >
                            <Printer size={17} />
                            Cetak {total} Label
                        </Link>
                    </div>
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
                                        {item.received_quantity} unit diterima ·{" "}
                                        {item.location.name}
                                    </p>
                                    {item.source_reference && (
                                        <p className="mt-2 inline-flex rounded-full border border-amber/40 bg-amber/10 px-2.5 py-1 font-num text-[10px] font-bold">
                                            NPB {item.source_reference}
                                        </p>
                                    )}
                                    {item.source_po_number && (
                                        <p className="ml-2 mt-2 inline-flex rounded-full border border-green/30 bg-green/10 px-2.5 py-1 font-num text-[10px] font-bold text-green">
                                            PO {item.source_po_number}
                                        </p>
                                    )}
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
                                {item.units.map((unit: any) => (
                                    <span
                                        key={unit.id}
                                        className="rounded border bg-canvas px-2 py-1 font-num text-[10px] font-bold"
                                    >
                                        {unit.asset_code}
                                    </span>
                                ))}
                            </div>
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
                        <Meta label="Owner" value={receipt.owner_institution} />
                        <Meta
                            label="Referensi permohonan"
                            value={receipt.request_reference ?? "—"}
                        />
                        <Meta label="Status" value={receipt.status} />
                        <Meta label="Catatan" value={receipt.notes ?? "—"} />
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
            {editing && (
                <EditReceipt
                    receipt={receipt}
                    close={() => setEditing(false)}
                />
            )}
        </TamsLayout>
    );
}

function EditReceipt({ receipt, close }: { receipt: any; close: () => void }) {
    const [reference, setReference] = useState(receipt.request_reference ?? "");
    const [notes, setNotes] = useState(receipt.notes ?? "");
    const [document, setDocument] = useState<File | null>(null);
    const [removeDocument, setRemoveDocument] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submit = () => {
        const data = new FormData();
        data.append("_method", "patch");
        data.append("request_reference", reference);
        data.append("notes", notes);
        data.append("remove_document", removeDocument ? "1" : "0");
        if (document) data.append("document", document);

        setProcessing(true);
        router.post(`/inventaris/penerimaan/${receipt.id}`, data, {
            forceFormData: true,
            onError: setErrors,
            onSuccess: close,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/65 p-4">
            <Panel className="w-full max-w-xl overflow-hidden">
                <div className="hazard-stripe h-2" />
                <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="font-num text-xs font-bold text-green">
                                {receipt.reference_no}
                            </p>
                            <h2 className="font-display text-3xl font-bold">
                                Ubah Data Penerimaan
                            </h2>
                            <p className="mt-1 text-xs text-muted">
                                Kode penerimaan dan unit di dalam batch tidak
                                berubah.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={close}
                            aria-label="Tutup"
                        >
                            <X />
                        </button>
                    </div>

                    <div className="mt-5 space-y-4">
                        <label className="block">
                            <span className="label">Referensi permohonan</span>
                            <input
                                className="control"
                                value={reference}
                                onChange={(event) =>
                                    setReference(event.target.value)
                                }
                            />
                            {errors.request_reference && (
                                <span className="mt-1 block text-xs text-red">
                                    {errors.request_reference}
                                </span>
                            )}
                        </label>
                        <label className="block">
                            <span className="label">Catatan penerimaan</span>
                            <textarea
                                className="control min-h-24"
                                value={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                            />
                        </label>
                        <label className="block rounded-lg border border-dashed border-line bg-canvas/60 p-4">
                            <span className="flex items-center gap-2 font-semibold">
                                <Upload size={17} />
                                {receipt.document_url
                                    ? "Ganti dokumen pendukung"
                                    : "Tambahkan dokumen pendukung"}
                            </span>
                            <span className="mt-1 block text-xs text-muted">
                                PDF/JPG/PNG, maksimal 5 MB
                            </span>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="mt-3 block w-full text-xs"
                                onChange={(event) => {
                                    setDocument(
                                        event.target.files?.[0] ?? null,
                                    );
                                    setRemoveDocument(false);
                                }}
                            />
                            {errors.document && (
                                <span className="mt-1 block text-xs text-red">
                                    {errors.document}
                                </span>
                            )}
                        </label>
                        {receipt.document_url && !document && (
                            <label className="flex items-center gap-3 rounded border border-red/25 bg-red/5 p-3 text-sm text-red">
                                <input
                                    type="checkbox"
                                    checked={removeDocument}
                                    onChange={(event) =>
                                        setRemoveDocument(event.target.checked)
                                    }
                                />
                                <Trash2 size={16} />
                                Hapus dokumen pendukung saat ini
                            </label>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-2 border-t pt-5">
                        <button
                            type="button"
                            onClick={close}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={processing}
                            className="btn-primary"
                        >
                            {processing ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </div>
            </Panel>
        </div>
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
