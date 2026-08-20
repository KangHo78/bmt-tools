import { Head, router } from "@inertiajs/react";
import { CheckCircle2, Plus, Wrench, X } from "lucide-react";
import { useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import {
    EmptyState,
    PageHeader,
    Panel,
    StatusBadge,
} from "@/Components/TamsUI";
import { formatDate } from "@/lib/ui";

export default function Index({
    orders,
    units,
}: {
    orders: any[];
    units: any[];
}) {
    const [create, setCreate] = useState(false);
    const [active, setActive] = useState<any>(null);
    return (
        <TamsLayout>
            <Head title="Pemeliharaan" />
            <PageHeader
                eyebrow="Maintenance control"
                title="Pemeliharaan"
                description="Jadwalkan pembersihan, inspeksi, kalibrasi, servis, dan perbaikan unit."
                action={
                    <button
                        onClick={() => setCreate(true)}
                        className="btn-primary"
                    >
                        <Plus size={17} />
                        Work Order Baru
                    </button>
                }
            />
            <div className="mb-5 grid gap-3 sm:grid-cols-4">
                {["dijadwalkan", "berjalan", "terlambat", "selesai"].map(
                    (status) => (
                        <Panel key={status} className="p-4">
                            <StatusBadge status={status} />
                            <p className="mt-4 font-num text-3xl font-semibold">
                                {
                                    orders.filter((x) => x.status === status)
                                        .length
                                }
                            </p>
                        </Panel>
                    ),
                )}
            </div>
            <Panel className="overflow-hidden">
                {orders.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[840px] text-left text-sm">
                            <thead className="bg-ink text-[10px] uppercase tracking-wider text-white">
                                <tr>
                                    <th className="p-3">Work Order</th>
                                    <th className="p-3">Unit</th>
                                    <th className="p-3">Jenis/Tindakan</th>
                                    <th className="p-3">Pelaksana</th>
                                    <th className="p-3">Jadwal</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => (
                                    <tr
                                        key={o.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="p-3 font-num text-xs font-bold">
                                            {o.work_order_no}
                                        </td>
                                        <td className="p-3">
                                            <strong>
                                                {o.unit.tool_type.name}
                                            </strong>
                                            <small>{o.unit.asset_code}</small>
                                        </td>
                                        <td className="p-3">
                                            <span className="capitalize text-green">
                                                {o.type}
                                            </span>
                                            <p className="max-w-xs truncate text-xs">
                                                {o.action}
                                            </p>
                                        </td>
                                        <td className="p-3 text-xs">
                                            {o.technician ??
                                                o.vendor ??
                                                "Belum ditentukan"}
                                        </td>
                                        <td className="p-3">
                                            {formatDate(o.scheduled_date)}
                                        </td>
                                        <td className="p-3">
                                            <StatusBadge status={o.status} />
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => setActive(o)}
                                                className="btn-secondary !min-h-9 !px-3"
                                            >
                                                <Wrench size={15} />
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState />
                )}
            </Panel>
            {create && (
                <CreateOrder units={units} close={() => setCreate(false)} />
            )}{" "}
            {active && (
                <UpdateOrder order={active} close={() => setActive(null)} />
            )}
        </TamsLayout>
    );
}
function CreateOrder({ units, close }: { units: any[]; close: () => void }) {
    const [d, setD] = useState({
        unit_id: "",
        type: "servis",
        action: "",
        technician: "",
        vendor: "",
        scheduled_date: "",
        notes: "",
    });
    const submit = () => router.post("/pemeliharaan", d, { onSuccess: close });
    return (
        <Modal title="Work Order Baru" close={close}>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Unit" wide>
                    <select
                        className="control"
                        value={d.unit_id}
                        onChange={(e) =>
                            setD({ ...d, unit_id: e.target.value })
                        }
                    >
                        <option value="">Pilih unit</option>
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.asset_code} · {u.tool_type.name}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Jenis">
                    <select
                        className="control"
                        value={d.type}
                        onChange={(e) => setD({ ...d, type: e.target.value })}
                    >
                        {[
                            "pembersihan",
                            "inspeksi",
                            "kalibrasi",
                            "servis",
                            "perbaikan",
                        ].map((x) => (
                            <option key={x}>{x}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Jadwal">
                    <input
                        type="date"
                        className="control"
                        value={d.scheduled_date}
                        onChange={(e) =>
                            setD({ ...d, scheduled_date: e.target.value })
                        }
                    />
                </Field>
                <Field label="Teknisi">
                    <input
                        className="control"
                        value={d.technician}
                        onChange={(e) =>
                            setD({ ...d, technician: e.target.value })
                        }
                    />
                </Field>
                <Field label="Vendor">
                    <input
                        className="control"
                        value={d.vendor}
                        onChange={(e) => setD({ ...d, vendor: e.target.value })}
                    />
                </Field>
                <Field label="Tindakan" wide>
                    <textarea
                        className="control min-h-20"
                        value={d.action}
                        onChange={(e) => setD({ ...d, action: e.target.value })}
                    />
                </Field>
            </div>
            <button
                disabled={!d.unit_id || !d.action || !d.scheduled_date}
                onClick={submit}
                className="btn-primary mt-5 w-full"
            >
                Buat Work Order
            </button>
        </Modal>
    );
}
function UpdateOrder({ order, close }: { order: any; close: () => void }) {
    const [d, setD] = useState({
        status: order.status,
        cost: order.cost ?? "",
        notes: order.notes ?? "",
        next_schedule_date: order.next_schedule_date ?? "",
    });
    const [photo, setPhoto] = useState<File | null>(null);
    const submit = () => {
        const fd = new FormData();
        Object.entries(d).forEach(([k, v]) => fd.append(k, String(v)));
        if (photo) fd.append("after_photo", photo);
        router.post(`/pemeliharaan/${order.id}`, fd, {
            forceFormData: true,
            onSuccess: close,
        });
    };
    return (
        <Modal title={order.work_order_no} close={close}>
            <div className="space-y-4">
                <Field label="Status">
                    <select
                        className="control"
                        value={d.status}
                        onChange={(e) => setD({ ...d, status: e.target.value })}
                    >
                        {[
                            "dijadwalkan",
                            "berjalan",
                            "terlambat",
                            "selesai",
                        ].map((x) => (
                            <option key={x}>{x}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Biaya">
                    <input
                        type="number"
                        min="0"
                        className="control"
                        value={d.cost}
                        onChange={(e) => setD({ ...d, cost: e.target.value })}
                    />
                </Field>
                <Field label="Jadwal berikutnya">
                    <input
                        type="date"
                        className="control"
                        value={d.next_schedule_date}
                        onChange={(e) =>
                            setD({ ...d, next_schedule_date: e.target.value })
                        }
                    />
                </Field>
                <Field label="Catatan hasil">
                    <textarea
                        className="control min-h-24"
                        value={d.notes}
                        onChange={(e) => setD({ ...d, notes: e.target.value })}
                    />
                </Field>
                <Field label="Foto setelah pekerjaan">
                    <input
                        type="file"
                        accept="image/*"
                        className="control"
                        onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                    />
                </Field>
                <button onClick={submit} className="btn-primary w-full">
                    <CheckCircle2 size={17} />
                    Simpan Hasil
                </button>
            </div>
        </Modal>
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
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/60 p-4">
            <Panel className="w-full max-w-2xl p-5">
                <div className="mb-5 flex justify-between">
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
function Field({
    label,
    wide = false,
    children,
}: {
    label: string;
    wide?: boolean;
    children: any;
}) {
    return (
        <label className={wide ? "sm:col-span-2" : ""}>
            <span className="label">{label}</span>
            {children}
        </label>
    );
}
