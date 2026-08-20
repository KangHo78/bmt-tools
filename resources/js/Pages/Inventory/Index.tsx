import { Head, Link, router } from "@inertiajs/react";
import { ArrowRightLeft, PackagePlus, Printer, Search, X } from "lucide-react";
import { useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import {
    EmptyState,
    PageHeader,
    Pagination,
    Panel,
    StatusBadge,
} from "@/Components/TamsUI";
import { formatDate } from "@/lib/ui";

export default function Index({
    units,
    receipts,
    locations,
    filters,
}: {
    units: any;
    receipts: any[];
    locations: any[];
    filters: any;
}) {
    const [q, setQ] = useState(filters.q ?? "");
    const [move, setMove] = useState<any>(null);
    return (
        <TamsLayout>
            <Head title="Inventaris" />
            <PageHeader
                eyebrow="Asset control"
                title="Inventaris & Penerimaan"
                description="Daftarkan aset masuk, cetak label, dan telusuri posisi setiap unit."
                action={
                    <Link
                        href="/inventaris/penerimaan/baru"
                        className="btn-primary"
                    >
                        <PackagePlus size={17} />
                        Penerimaan Baru
                    </Link>
                }
            />
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                <Panel className="overflow-hidden">
                    <div className="flex gap-2 border-b p-4">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-3.5 text-muted"
                                size={17}
                            />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    router.get("/inventaris", { q })
                                }
                                className="control pl-10"
                                placeholder="Cari kode aset..."
                            />
                        </div>
                        <button
                            onClick={() => router.get("/inventaris", { q })}
                            className="btn-secondary"
                        >
                            Cari
                        </button>
                    </div>
                    {units.data.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-ink text-[10px] uppercase tracking-wider text-white">
                                    <tr>
                                        <th className="p-3">Kode</th>
                                        <th className="p-3">Jenis</th>
                                        <th className="p-3">Lokasi</th>
                                        <th className="p-3">Kondisi</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {units.data.map((u: any) => (
                                        <tr
                                            key={u.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="p-3 font-num text-xs font-bold">
                                                {u.asset_code}
                                            </td>
                                            <td className="p-3">
                                                <strong>
                                                    {u.tool_type.name}
                                                </strong>
                                                <small>
                                                    {u.serial_number ??
                                                        "Tanpa serial"}
                                                </small>
                                            </td>
                                            <td className="p-3 text-xs">
                                                {u.location?.name ?? "—"}
                                            </td>
                                            <td className="p-3 capitalize">
                                                {u.condition.replaceAll(
                                                    "_",
                                                    " ",
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <StatusBadge
                                                    status={u.status}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <button
                                                    disabled={
                                                        u.status === "dipinjam"
                                                    }
                                                    onClick={() => setMove(u)}
                                                    className="btn-secondary !min-h-9 !px-2"
                                                >
                                                    <ArrowRightLeft size={15} />
                                                    Pindah
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
                    <Pagination links={units.links} />
                </Panel>
                <Panel className="h-fit overflow-hidden">
                    <div className="border-b p-4">
                        <p className="label">Receiving log</p>
                        <h2 className="font-display text-2xl font-bold">
                            Penerimaan Terbaru
                        </h2>
                    </div>
                    {receipts.map((r) => (
                        <Link
                            href={`/inventaris/penerimaan/${r.id}`}
                            key={r.id}
                            className="block border-b p-4 last:border-0 hover:bg-canvas"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-num text-xs font-bold">
                                    {r.reference_no}
                                </span>
                                <span className="text-[10px] text-muted">
                                    {formatDate(r.received_date)}
                                </span>
                            </div>
                            <p className="mt-1 text-sm font-semibold">
                                {r.owner_institution}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                {r.items_count} jenis · {r.receiver?.name}
                            </p>
                        </Link>
                    ))}
                </Panel>
            </div>
            {move && (
                <MoveModal
                    unit={move}
                    locations={locations}
                    close={() => setMove(null)}
                />
            )}
        </TamsLayout>
    );
}
function MoveModal({
    unit,
    locations,
    close,
}: {
    unit: any;
    locations: any[];
    close: () => void;
}) {
    const [location, setLocation] = useState("");
    const [reason, setReason] = useState("");
    const submit = () =>
        router.post(
            `/inventaris/unit/${unit.id}/pindah`,
            { location_id: location, reason },
            { onSuccess: close },
        );
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4">
            <Panel className="w-full max-w-lg p-5">
                <div className="flex justify-between">
                    <div>
                        <p className="font-num text-xs text-green">
                            {unit.asset_code}
                        </p>
                        <h2 className="font-display text-3xl font-bold">
                            Mutasi Lokasi
                        </h2>
                    </div>
                    <button onClick={close}>
                        <X />
                    </button>
                </div>
                <div className="mt-5 space-y-4">
                    <label>
                        <span className="label">Lokasi tujuan</span>
                        <select
                            className="control"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        >
                            <option value="">Pilih lokasi</option>
                            {locations.map((x) => (
                                <option key={x.id} value={x.id}>
                                    {x.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span className="label">Alasan mutasi</span>
                        <textarea
                            className="control min-h-24"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </label>
                    <button
                        disabled={!location || reason.length < 5}
                        onClick={submit}
                        className="btn-primary w-full"
                    >
                        <ArrowRightLeft size={17} />
                        Konfirmasi Mutasi
                    </button>
                </div>
            </Panel>
        </div>
    );
}
