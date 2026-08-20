import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2, ScanLine } from "lucide-react";
import { useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import { PageHeader, Panel, StatusBadge } from "@/Components/TamsUI";

export default function Show({
    audit,
    locations,
}: {
    audit: any;
    locations: any[];
}) {
    const [scan, setScan] = useState({
        asset_code: "",
        location_id: "",
        condition: "baik",
        note: "",
    });
    const [review, setReview] = useState("");
    const [reconcile, setReconcile] = useState(true);
    const discrepancies = audit.items.filter(
        (x: any) => !["belum_discan", "sesuai"].includes(x.status),
    );
    const submit = () =>
        router.post(`/audit/${audit.id}/scan`, scan, {
            onSuccess: () => setScan({ ...scan, asset_code: "", note: "" }),
        });
    return (
        <TamsLayout>
            <Head title={audit.name} />
            <Link
                href="/audit"
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted"
            >
                <ArrowLeft size={16} />
                Daftar audit
            </Link>
            <PageHeader
                eyebrow="Live stock count"
                title={audit.name}
                description={`${audit.scope} · ${audit.assigned_to}`}
                action={<StatusBadge status={audit.status} />}
            />
            <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
                <div className="space-y-5">
                    <Panel className="overflow-hidden">
                        <div className="bg-ink p-5 text-white">
                            <ScanLine className="text-amber" />
                            <h2 className="mt-3 font-display text-3xl font-bold">
                                Scan Unit
                            </h2>
                            <p className="mt-1 text-xs text-white/60">
                                Masukkan label aset dan kondisi aktual.
                            </p>
                        </div>
                        <div className="space-y-4 p-5">
                            <Field label="Kode aset">
                                <input
                                    autoFocus
                                    className="control font-num"
                                    value={scan.asset_code}
                                    onChange={(e) =>
                                        setScan({
                                            ...scan,
                                            asset_code:
                                                e.target.value.toUpperCase(),
                                        })
                                    }
                                    placeholder="TWL-DRL-2026-0001"
                                />
                            </Field>
                            <Field label="Lokasi aktual">
                                <select
                                    className="control"
                                    value={scan.location_id}
                                    onChange={(e) =>
                                        setScan({
                                            ...scan,
                                            location_id: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Pilih lokasi</option>
                                    {locations.map((x) => (
                                        <option key={x.id} value={x.id}>
                                            {x.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Kondisi aktual">
                                <select
                                    className="control"
                                    value={scan.condition}
                                    onChange={(e) =>
                                        setScan({
                                            ...scan,
                                            condition: e.target.value,
                                        })
                                    }
                                >
                                    <option value="baik">Baik</option>
                                    <option value="perlu_perhatian">
                                        Perlu perhatian
                                    </option>
                                    <option value="rusak">Rusak</option>
                                    <option value="hilang">Hilang</option>
                                </select>
                            </Field>
                            <Field label="Catatan">
                                <textarea
                                    className="control min-h-20"
                                    value={scan.note}
                                    onChange={(e) =>
                                        setScan({
                                            ...scan,
                                            note: e.target.value,
                                        })
                                    }
                                />
                            </Field>
                            <button
                                disabled={!scan.asset_code || !scan.location_id}
                                onClick={submit}
                                className="btn-primary w-full"
                            >
                                <ScanLine size={17} />
                                Catat Hasil Scan
                            </button>
                        </div>
                    </Panel>
                    <Panel className="p-5">
                        <p className="label">Finalisasi</p>
                        <p className="text-sm text-muted">
                            {audit.checked_units} dari {audit.total_units} unit
                            diperiksa. {discrepancies.length} selisih ditemukan.
                        </p>
                        <textarea
                            className="control mt-4 min-h-20"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Catatan reviewer..."
                        />
                        <label className="mt-3 flex gap-2 text-xs">
                            <input
                                type="checkbox"
                                checked={reconcile}
                                onChange={(e) => setReconcile(e.target.checked)}
                                className="accent-green"
                            />
                            Perbarui lokasi dan kondisi unit dari hasil scan
                        </label>
                        <button
                            disabled={
                                review.length < 5 || audit.status === "selesai"
                            }
                            onClick={() =>
                                router.post(`/audit/${audit.id}/selesai`, {
                                    reviewer_note: review,
                                    reconcile,
                                })
                            }
                            className="btn-primary mt-4 w-full"
                        >
                            <CheckCircle2 size={17} />
                            Finalisasi Audit
                        </button>
                    </Panel>
                </div>
                <Panel className="overflow-hidden">
                    <div className="flex items-center justify-between border-b p-5">
                        <div>
                            <p className="label">Snapshot progress</p>
                            <h2 className="font-display text-2xl font-bold">
                                {audit.checked_units} / {audit.total_units} Unit
                            </h2>
                        </div>
                        <span className="font-num text-2xl font-semibold text-green">
                            {audit.total_units
                                ? Math.round(
                                      (audit.checked_units /
                                          audit.total_units) *
                                          100,
                                  )
                                : 0}
                            %
                        </span>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto divide-y">
                        {audit.items.map((item: any) => (
                            <div
                                key={item.id}
                                className="grid gap-2 p-4 sm:grid-cols-[1fr_180px_150px] sm:items-center"
                            >
                                <div>
                                    <p className="font-num text-xs font-bold">
                                        {item.unit.asset_code}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold">
                                        {item.unit.tool_type.name}
                                    </p>
                                </div>
                                <div className="text-xs">
                                    <p className="text-muted">
                                        Harapan:{" "}
                                        {item.expected_location?.name ?? "—"}
                                    </p>
                                    <p>
                                        Aktual:{" "}
                                        {item.actual_location?.name ??
                                            "Belum discan"}
                                    </p>
                                </div>
                                <StatusBadge status={item.status} />
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </TamsLayout>
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
