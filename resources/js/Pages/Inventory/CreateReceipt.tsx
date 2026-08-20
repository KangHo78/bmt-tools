import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, PackagePlus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import { PageHeader, Panel } from "@/Components/TamsUI";

const blank = () => ({
    tool_type_id: "",
    location_id: "",
    requested_quantity: 1,
    received_quantity: 1,
    initial_condition: "baik",
    difference_reason: "",
});
export default function CreateReceipt({
    toolTypes,
    locations,
}: {
    toolTypes: any[];
    locations: any[];
}) {
    const [form, setForm] = useState({
        request_reference: "",
        owner_institution: "",
        received_date: new Date().toISOString().slice(0, 10),
        notes: "",
    });
    const [items, setItems] = useState([blank()]);
    const [document, setDocument] = useState<File | null>(null);
    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);
    const row = (i: number, key: string, value: any) =>
        setItems(items.map((x, n) => (n === i ? { ...x, [key]: value } : x)));
    const submit = () => {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        items.forEach((x, i) =>
            Object.entries(x).forEach(([k, v]) =>
                fd.append(`items[${i}][${k}]`, String(v)),
            ),
        );
        if (document) fd.append("document", document);
        setProcessing(true);
        router.post("/inventaris/penerimaan", fd, {
            forceFormData: true,
            onError: setErrors,
            onFinish: () => setProcessing(false),
        });
    };
    return (
        <TamsLayout>
            <Head title="Penerimaan Aset" />
            <Link
                href="/inventaris"
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted"
            >
                <ArrowLeft size={16} />
                Inventaris
            </Link>
            <PageHeader
                eyebrow="Receiving workflow"
                title="Penerimaan Aset"
                description="Cocokkan permohonan, kondisi awal, lokasi, dan jumlah unit yang benar-benar diterima."
            />
            <div className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]">
                <Panel className="h-fit p-5">
                    <h2 className="font-display text-2xl font-bold">
                        Dokumen Penerimaan
                    </h2>
                    <div className="mt-5 space-y-4">
                        <Field label="Referensi permohonan">
                            <input
                                className="control"
                                value={form.request_reference}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        request_reference: e.target.value,
                                    })
                                }
                            />
                        </Field>
                        <Field
                            label="Owner / Lembaga"
                            error={errors.owner_institution}
                        >
                            <input
                                className="control"
                                value={form.owner_institution}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        owner_institution: e.target.value,
                                    })
                                }
                            />
                        </Field>
                        <Field
                            label="Tanggal diterima"
                            error={errors.received_date}
                        >
                            <input
                                type="date"
                                className="control"
                                value={form.received_date}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        received_date: e.target.value,
                                    })
                                }
                            />
                        </Field>
                        <Field label="Dokumen pendukung">
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="control"
                                onChange={(e) =>
                                    setDocument(e.target.files?.[0] ?? null)
                                }
                            />
                        </Field>
                        <Field label="Catatan">
                            <textarea
                                className="control min-h-20"
                                value={form.notes}
                                onChange={(e) =>
                                    setForm({ ...form, notes: e.target.value })
                                }
                            />
                        </Field>
                    </div>
                </Panel>
                <Panel className="overflow-hidden">
                    <div className="flex items-center justify-between border-b p-5">
                        <div>
                            <p className="label">Item manifest</p>
                            <h2 className="font-display text-2xl font-bold">
                                Jenis dan Jumlah Alat
                            </h2>
                        </div>
                        <button
                            onClick={() => setItems([...items, blank()])}
                            className="btn-secondary"
                        >
                            <Plus size={16} />
                            Tambah Baris
                        </button>
                    </div>
                    <div className="space-y-4 p-4">
                        {items.map((x, i) => (
                            <div
                                key={i}
                                className="rounded-lg border bg-canvas/40 p-4"
                            >
                                <div className="mb-3 flex justify-between">
                                    <span className="font-num text-xs font-bold">
                                        ITEM {String(i + 1).padStart(2, "0")}
                                    </span>
                                    {items.length > 1 && (
                                        <button
                                            onClick={() =>
                                                setItems(
                                                    items.filter(
                                                        (_, n) => n !== i,
                                                    ),
                                                )
                                            }
                                            className="text-red"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field label="Jenis alat">
                                        <select
                                            className="control"
                                            value={x.tool_type_id}
                                            onChange={(e) =>
                                                row(
                                                    i,
                                                    "tool_type_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                Pilih jenis
                                            </option>
                                            {toolTypes.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.code} · {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Lokasi awal">
                                        <select
                                            className="control"
                                            value={x.location_id}
                                            onChange={(e) =>
                                                row(
                                                    i,
                                                    "location_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                Pilih lokasi
                                            </option>
                                            {locations.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Jumlah diminta">
                                        <input
                                            type="number"
                                            min="1"
                                            className="control"
                                            value={x.requested_quantity}
                                            onChange={(e) =>
                                                row(
                                                    i,
                                                    "requested_quantity",
                                                    Number(e.target.value),
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field label="Jumlah diterima">
                                        <input
                                            type="number"
                                            min="0"
                                            className="control"
                                            value={x.received_quantity}
                                            onChange={(e) =>
                                                row(
                                                    i,
                                                    "received_quantity",
                                                    Number(e.target.value),
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field label="Kondisi awal">
                                        <select
                                            className="control"
                                            value={x.initial_condition}
                                            onChange={(e) =>
                                                row(
                                                    i,
                                                    "initial_condition",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="baik">Baik</option>
                                            <option value="perlu_perhatian">
                                                Perlu perhatian
                                            </option>
                                            <option value="rusak">Rusak</option>
                                        </select>
                                    </Field>
                                    {x.requested_quantity !==
                                        x.received_quantity && (
                                        <Field label="Alasan selisih">
                                            <input
                                                className="control"
                                                value={x.difference_reason}
                                                onChange={(e) =>
                                                    row(
                                                        i,
                                                        "difference_reason",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t p-4">
                        <button
                            disabled={
                                processing ||
                                !form.owner_institution ||
                                items.some(
                                    (x) => !x.tool_type_id || !x.location_id,
                                )
                            }
                            onClick={submit}
                            className="btn-primary w-full"
                        >
                            <PackagePlus size={17} />
                            {processing
                                ? "Memproses..."
                                : "Selesaikan & Buat Kode Aset"}
                        </button>
                    </div>
                </Panel>
            </div>
        </TamsLayout>
    );
}
function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: any;
}) {
    return (
        <label>
            <span className="label">{label}</span>
            {children}
            {error && (
                <span className="mt-1 block text-xs text-red">{error}</span>
            )}
        </label>
    );
}
