import { Head, Link, router } from "@inertiajs/react";
import { ArrowRight, Plus, ScanLine, X } from "lucide-react";
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
    audits,
    locations,
}: {
    audits: any[];
    locations: any[];
}) {
    const [create, setCreate] = useState(false);
    return (
        <TamsLayout>
            <Head title="Audit Stok" />
            <PageHeader
                eyebrow="Stock assurance"
                title="Audit Stok"
                description="Buat snapshot, pindai unit, dan rekonsiliasi selisih secara bulanan."
                action={
                    <button
                        onClick={() => setCreate(true)}
                        className="btn-primary"
                    >
                        <Plus size={17} />
                        Audit Baru
                    </button>
                }
            />
            <div className="grid gap-4 lg:grid-cols-2">
                {audits.length ? (
                    audits.map((a) => (
                        <Panel key={a.id} className="overflow-hidden">
                            <div className="hazard-stripe h-2" />
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-num text-[10px] text-muted">
                                            {formatDate(a.scheduled_date)}
                                        </p>
                                        <h2 className="font-display text-2xl font-bold">
                                            {a.name}
                                        </h2>
                                        <p className="mt-1 text-xs text-muted">
                                            {a.scope} · {a.assigned_to}
                                        </p>
                                    </div>
                                    <StatusBadge status={a.status} />
                                </div>
                                <div className="mt-5 flex items-end justify-between">
                                    <span className="font-num text-3xl font-semibold">
                                        {a.checked_units}/{a.total_units}
                                    </span>
                                    <span className="text-xs text-muted">
                                        {a.total_units
                                            ? Math.round(
                                                  (a.checked_units /
                                                      a.total_units) *
                                                      100,
                                              )
                                            : 0}
                                        %
                                    </span>
                                </div>
                                <div className="mt-2 h-2 rounded bg-line">
                                    <div
                                        className="h-full rounded bg-green"
                                        style={{
                                            width: `${a.total_units ? (a.checked_units / a.total_units) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                                <Link
                                    href={`/audit/${a.id}`}
                                    className="btn-secondary mt-4 w-full"
                                >
                                    <ScanLine size={17} />
                                    {a.status === "draf"
                                        ? "Mulai Audit"
                                        : "Buka Sesi"}
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </Panel>
                    ))
                ) : (
                    <Panel className="lg:col-span-2">
                        <EmptyState title="Belum ada sesi audit" />
                    </Panel>
                )}
            </div>
            {create && (
                <CreateAudit
                    locations={locations}
                    close={() => setCreate(false)}
                />
            )}
        </TamsLayout>
    );
}
function CreateAudit({
    locations,
    close,
}: {
    locations: any[];
    close: () => void;
}) {
    const [d, setD] = useState({
        name:
            "Audit Bulanan " +
            new Intl.DateTimeFormat("id-ID", {
                month: "long",
                year: "numeric",
            }).format(new Date()),
        scope: "Seluruh Tool Room",
        location_id: "",
        assigned_to: "",
        scheduled_date: new Date().toISOString().slice(0, 10),
    });
    const submit = () => router.post("/audit", d, { onSuccess: close });
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4">
            <Panel className="w-full max-w-lg p-5">
                <div className="flex justify-between">
                    <h2 className="font-display text-3xl font-bold">
                        Buat Snapshot Audit
                    </h2>
                    <button onClick={close}>
                        <X />
                    </button>
                </div>
                <div className="mt-5 space-y-4">
                    <Field label="Nama audit">
                        <input
                            className="control"
                            value={d.name}
                            onChange={(e) =>
                                setD({ ...d, name: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="Cakupan">
                        <input
                            className="control"
                            value={d.scope}
                            onChange={(e) =>
                                setD({ ...d, scope: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="Batasi lokasi (opsional)">
                        <select
                            className="control"
                            value={d.location_id}
                            onChange={(e) =>
                                setD({ ...d, location_id: e.target.value })
                            }
                        >
                            <option value="">Semua lokasi</option>
                            {locations.map((x) => (
                                <option key={x.id} value={x.id}>
                                    {x.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Petugas">
                        <input
                            className="control"
                            value={d.assigned_to}
                            onChange={(e) =>
                                setD({ ...d, assigned_to: e.target.value })
                            }
                        />
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
                    <button
                        disabled={!d.name || !d.scope || !d.assigned_to}
                        onClick={submit}
                        className="btn-primary w-full"
                    >
                        Buat Snapshot Stok
                    </button>
                </div>
            </Panel>
        </div>
    );
}
function Field({ label, children }: { label: string; children: any }) {
    return (
        <label>
            <span className="label">{label}</span>
            {children}
        </label>
    );
}
