import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowRight,
    ArrowRightLeft,
    Boxes,
    FileText,
    Layers3,
    PackagePlus,
    Search,
    UserRound,
    X,
} from "lucide-react";
import { useState } from "react";
import SearchableSelect from "@/Components/SearchableSelect";
import {
    EmptyState,
    PageHeader,
    Pagination,
    Panel,
    StatusBadge,
} from "@/Components/TamsUI";
import TamsLayout from "@/Layouts/TamsLayout";
import { formatDate } from "@/lib/ui";

export default function Index({ units, receipts, locations, filters }: any) {
    const [q, setQ] = useState(filters.q ?? "");
    const [move, setMove] = useState<any>(null);
    const view = filters.view ?? "receipts";
    const search = () => router.get("/inventaris", { q, view });

    return (
        <TamsLayout>
            <Head title="Inventaris" />
            <PageHeader
                eyebrow="Asset control"
                title="Inventaris & Penerimaan"
                description="Kelola setiap penerimaan sebagai satu batch, lalu telusuri unit individual di dalamnya."
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

            <div className="mb-4 flex flex-wrap gap-2">
                <Link
                    href="/inventaris?view=receipts"
                    className={
                        view === "receipts" ? "btn-primary" : "btn-secondary"
                    }
                >
                    <Layers3 size={17} />
                    Batch Penerimaan
                </Link>
                <Link
                    href="/inventaris?view=units"
                    className={
                        view === "units" ? "btn-primary" : "btn-secondary"
                    }
                >
                    <Boxes size={17} />
                    Daftar Unit
                </Link>
            </div>

            <Panel className="overflow-hidden">
                <div className="flex gap-2 border-b p-4">
                    <div className="relative flex-1">
                        <Search
                            className="absolute left-3 top-3.5 text-muted"
                            size={17}
                        />
                        <input
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            onKeyDown={(event) =>
                                event.key === "Enter" && search()
                            }
                            className="control pl-10"
                            placeholder={
                                view === "receipts"
                                    ? "Cari kode penerimaan, referensi, owner, atau barang..."
                                    : "Cari kode aset, jenis, atau owner..."
                            }
                        />
                    </div>
                    <button onClick={search} className="btn-secondary">
                        Cari
                    </button>
                </div>

                {view === "receipts" ? (
                    <ReceiptGroups receipts={receipts} />
                ) : (
                    <UnitRegister units={units} onMove={setMove} />
                )}
            </Panel>

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

function ReceiptGroups({ receipts }: { receipts: any }) {
    if (!receipts.data.length)
        return <EmptyState title="Belum ada batch penerimaan" />;

    return (
        <>
            <div className="hidden grid-cols-[150px_130px_1fr_1.4fr_100px_140px_32px] gap-4 border-b bg-ink px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white lg:grid">
                <span>Kode Penerimaan</span>
                <span>Tanggal</span>
                <span>Owner</span>
                <span>Isi Batch</span>
                <span>Jumlah</span>
                <span>Dokumen</span>
                <span />
            </div>
            {receipts.data.map((receipt: any) => {
                const itemNames = receipt.items
                    .map((item: any) => item.tool_type.name)
                    .join(" · ");

                return (
                    <Link
                        key={receipt.id}
                        href={`/inventaris/penerimaan/${receipt.id}`}
                        className="group grid gap-3 border-b px-5 py-5 last:border-0 hover:bg-green/5 lg:grid-cols-[150px_130px_1fr_1.4fr_100px_140px_32px] lg:items-center lg:gap-4"
                    >
                        <div>
                            <p className="font-num text-sm font-bold text-green">
                                {receipt.reference_no}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-wide text-muted">
                                {receipt.request_reference || "Tanpa referensi"}
                            </p>
                        </div>
                        <p className="font-num text-xs">
                            {formatDate(receipt.received_date)}
                        </p>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                                {receipt.owner_institution}
                            </p>
                            <p className="truncate text-xs text-muted">
                                Diterima oleh {receipt.receiver?.name}
                            </p>
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                                {itemNames}
                            </p>
                            <p className="text-xs text-muted">
                                {receipt.items_count} jenis barang
                            </p>
                        </div>
                        <p className="font-num text-lg font-bold">
                            {receipt.total_units} unit
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                            <FileText
                                size={16}
                                className={
                                    receipt.document_url
                                        ? "text-green"
                                        : "text-muted"
                                }
                            />
                            {receipt.document_url ? "Tersedia" : "Belum ada"}
                        </div>
                        <ArrowRight
                            size={18}
                            className="text-muted transition group-hover:translate-x-1 group-hover:text-green"
                        />
                    </Link>
                );
            })}
            <Pagination links={receipts.links} />
        </>
    );
}

function UnitRegister({
    units,
    onMove,
}: {
    units: any;
    onMove: (unit: any) => void;
}) {
    if (!units.data.length) return <EmptyState />;

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                    <thead className="bg-ink text-[10px] uppercase tracking-wider text-white">
                        <tr>
                            <th className="p-3">Kode</th>
                            <th className="p-3">Jenis</th>
                            <th className="p-3">Lokasi</th>
                            <th className="p-3">Owner Aset</th>
                            <th className="p-3">Kondisi</th>
                            <th className="p-3">Status</th>
                            <th className="p-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {units.data.map((unit: any) => (
                            <tr
                                key={unit.id}
                                className="border-b last:border-0"
                            >
                                <td className="p-3 font-num text-xs font-bold">
                                    {unit.asset_code}
                                </td>
                                <td className="p-3">
                                    <strong>{unit.tool_type.name}</strong>
                                    <small>
                                        {unit.serial_number ?? "Tanpa serial"}
                                    </small>
                                </td>
                                <td className="p-3 text-xs">
                                    {unit.location?.name ?? "—"}
                                </td>
                                <td className="p-3">
                                    {unit.owner ? (
                                        <div className="flex items-center gap-2">
                                            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-green/25 bg-green/10 text-green">
                                                <UserRound size={15} />
                                            </span>
                                            <div>
                                                <strong className="block text-xs">
                                                    {unit.owner}
                                                </strong>
                                                <small className="mt-0 text-[10px] uppercase tracking-wider text-muted">
                                                    {unit.owner_sso_user_id
                                                        ? "Terhubung BMT Multi"
                                                        : "Belum terhubung"}
                                                </small>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="inline-flex rounded-sm border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
                                            Belum ditetapkan
                                        </span>
                                    )}
                                </td>
                                <td className="p-3 capitalize">
                                    {unit.condition.replaceAll("_", " ")}
                                </td>
                                <td className="p-3">
                                    <StatusBadge status={unit.status} />
                                </td>
                                <td className="p-3">
                                    <button
                                        disabled={unit.status === "dipinjam"}
                                        onClick={() => onMove(unit)}
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
            <Pagination links={units.links} />
        </>
    );
}

function MoveModal({ unit, locations, close }: any) {
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
                    <button onClick={close} aria-label="Tutup">
                        <X />
                    </button>
                </div>
                <div className="mt-5 space-y-4">
                    <label>
                        <span className="label">Lokasi tujuan</span>
                        <SearchableSelect
                            className="control"
                            value={location}
                            onChange={(event) =>
                                setLocation(event.target.value)
                            }
                        >
                            <option value="">Pilih lokasi</option>
                            {locations.map((item: any) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </SearchableSelect>
                    </label>
                    <label>
                        <span className="label">Alasan mutasi</span>
                        <textarea
                            className="control min-h-24"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
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
