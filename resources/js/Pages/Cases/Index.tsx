import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowRight,
    FileWarning,
    KeyRound,
    Package,
    Search,
    UserRound,
    X,
} from "lucide-react";
import { useState } from "react";
import {
    EmptyState,
    PageHeader,
    Pagination,
    Panel,
    StatusBadge,
} from "@/Components/TamsUI";
import TamsLayout from "@/Layouts/TamsLayout";

export default function Index({
    cases,
    filters,
}: {
    cases: any;
    filters: { q?: string };
}) {
    const [query, setQuery] = useState(filters.q ?? "");
    const search = () =>
        router.get("/kasus", { q: query }, { preserveState: true });
    const clear = () => {
        setQuery("");
        router.get("/kasus");
    };

    return (
        <TamsLayout>
            <Head title="Kasus" />
            <PageHeader
                eyebrow="Accountability desk"
                title="Kerusakan & Kehilangan"
                description="Cari kasus berdasarkan peminjam, barang, transaksi, kode unit, atau token fisik."
            />

            <Panel className="mb-5 overflow-hidden">
                <div className="flex flex-col gap-3 p-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="absolute left-3 top-3.5 text-muted"
                        />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) =>
                                event.key === "Enter" && search()
                            }
                            className="control pl-10 pr-10"
                            placeholder="Nama peminjam, barang, TRX, kode unit, token, atau nomor kasus..."
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={clear}
                                aria-label="Hapus pencarian"
                                className="absolute right-3 top-3.5 text-muted hover:text-ink"
                            >
                                <X size={17} />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={search}
                        className="btn-primary"
                    >
                        <Search size={17} />
                        Cari Kasus
                    </button>
                </div>
                <div className="border-t bg-canvas/60 px-4 py-2 font-num text-[10px] font-bold uppercase tracking-wider text-muted">
                    {cases.total} kasus ditemukan
                </div>
            </Panel>

            <div className="grid gap-4 lg:grid-cols-2">
                {cases.data.length ? (
                    cases.data.map((assetCase: any) => {
                        const borrower =
                            assetCase.loan?.borrower ??
                            assetCase.responsible_user;
                        const loanItem = assetCase.loan?.items?.find(
                            (item: any) => item.unit_id === assetCase.unit_id,
                        );
                        const token = loanItem?.physical_token?.code;

                        return (
                            <Panel
                                key={assetCase.id}
                                className="overflow-hidden"
                            >
                                <div
                                    className={`h-2 ${assetCase.type === "hilang" ? "bg-red" : "hazard-stripe"}`}
                                />
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-num text-xs font-bold text-green">
                                                {assetCase.case_no}
                                                {assetCase.loan?.trx_no && (
                                                    <span className="ml-2 text-muted">
                                                        ·{" "}
                                                        {assetCase.loan.trx_no}
                                                    </span>
                                                )}
                                            </p>
                                            <h2 className="mt-1 truncate font-display text-2xl font-bold capitalize">
                                                {assetCase.type.replaceAll(
                                                    "_",
                                                    " ",
                                                )}{" "}
                                                ·{" "}
                                                {
                                                    assetCase.unit?.tool_type
                                                        ?.name
                                                }
                                            </h2>
                                            <p className="font-num text-[10px] text-muted">
                                                {assetCase.unit?.asset_code ??
                                                    "Unit tidak diketahui"}
                                            </p>
                                        </div>
                                        <StatusBadge status={assetCase.stage} />
                                    </div>

                                    <div className="mt-4 grid gap-2 rounded-md border bg-canvas/60 p-3 text-xs sm:grid-cols-3">
                                        <CaseMeta
                                            icon={<UserRound size={14} />}
                                            label="Peminjam"
                                            value={borrower?.name ?? "—"}
                                        />
                                        <CaseMeta
                                            icon={<Package size={14} />}
                                            label="Barang"
                                            value={
                                                assetCase.unit?.tool_type
                                                    ?.code ?? "—"
                                            }
                                        />
                                        <CaseMeta
                                            icon={<KeyRound size={14} />}
                                            label="Token Fisik"
                                            value={token ?? "—"}
                                            mono
                                        />
                                    </div>

                                    <p className="mt-4 line-clamp-2 text-sm text-muted">
                                        {assetCase.chronology}
                                    </p>
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                                        <Check
                                            ok={assetCase.has_evidence}
                                            label="BUKTI"
                                        />
                                        <Check
                                            ok={assetCase.has_berita_acara}
                                            label="BERITA ACARA"
                                        />
                                        <Check
                                            ok={assetCase.has_decision}
                                            label="KEPUTUSAN"
                                        />
                                    </div>
                                    <Link
                                        href={`/kasus/${assetCase.id}`}
                                        className="btn-secondary mt-4 w-full"
                                    >
                                        <FileWarning size={17} />
                                        Kelola Kasus
                                        <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </Panel>
                        );
                    })
                ) : (
                    <Panel className="lg:col-span-2">
                        <EmptyState
                            title={
                                filters.q
                                    ? "Kasus tidak ditemukan"
                                    : "Tidak ada kasus tercatat"
                            }
                        />
                    </Panel>
                )}
            </div>
            <Pagination links={cases.links} />
        </TamsLayout>
    );
}

function CaseMeta({ icon, label, value, mono = false }: any) {
    return (
        <div className="min-w-0">
            <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-muted">
                {icon} {label}
            </p>
            <p
                className={`mt-1 truncate font-semibold ${mono ? "font-num" : ""}`}
            >
                {value}
            </p>
        </div>
    );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
    return (
        <div
            className={`rounded border p-2 ${ok ? "border-green/30 bg-green/10 text-green" : "border-red/30 bg-red/10 text-red"}`}
        >
            {ok ? "✓" : "!"} {label}
        </div>
    );
}
