import { Head, Link, router } from "@inertiajs/react";
import { Filter, Plus, Search } from "lucide-react";
import { useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import SearchableSelect from "@/Components/SearchableSelect";
import {
    AssetVisual,
    EmptyState,
    PageHeader,
    Pagination,
    Panel,
} from "@/Components/TamsUI";
import type { ToolType } from "@/types/tams";

export default function Index({
    tools,
    categories,
    filters,
}: {
    tools: { data: ToolType[]; links: any[] };
    categories: any[];
    filters: { q?: string; category?: string };
}) {
    const [q, setQ] = useState(filters.q ?? "");
    const apply = (category = filters.category ?? "") =>
        router.get(
            "/katalog",
            { q, category },
            { preserveState: true, replace: true },
        );
    return (
        <TamsLayout>
            <Head title="Katalog Alat" />
            <PageHeader
                eyebrow="Asset directory"
                title="Katalog Alat"
                description="Cari ketersediaan, spesifikasi, dan lokasi penyimpanan alat kerja."
                action={
                    <Link href="/peminjaman/baru" className="btn-primary">
                        <Plus size={17} />
                        Ajukan Pinjaman
                    </Link>
                }
            />
            <Panel className="mb-5 p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-3.5 text-muted"
                            size={17}
                        />
                        <input
                            className="control pl-10"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && apply()}
                            placeholder="Nama atau kode alat..."
                        />
                    </div>
                    <SearchableSelect
                        className="control"
                        value={filters.category ?? ""}
                        onChange={(e) => apply(e.target.value)}
                    >
                        <option value="">Semua kategori</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </SearchableSelect>
                    <button onClick={() => apply()} className="btn-secondary">
                        <Filter size={17} />
                        Terapkan
                    </button>
                </div>
            </Panel>
            {tools.data.length ? (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {tools.data.map((tool) => (
                            <Link
                                key={tool.id}
                                href={`/katalog/${tool.id}`}
                                className="panel group overflow-hidden hover:-translate-y-1 hover:border-ink hover:shadow-xl"
                            >
                                <AssetVisual
                                    code={tool.code}
                                    imageUrl={tool.catalog_image_url}
                                    alt={tool.name}
                                />
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-num text-[11px] font-bold text-muted">
                                            {tool.code}
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-1 text-[11px] font-bold ${(tool.available_count ?? 0) > 0 ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}
                                        >
                                            {tool.available_count}/
                                            {tool.units_count} tersedia
                                        </span>
                                    </div>
                                    <h2 className="mt-2 font-display text-2xl font-bold group-hover:text-green">
                                        {tool.name}
                                    </h2>
                                    <p className="mt-1 text-xs text-muted">
                                        {tool.category?.name} · {tool.size}
                                    </p>
                                    <div className="mt-4 border-t pt-3 text-xs">
                                        <span className="text-muted">
                                            Lokasi utama
                                        </span>
                                        <p className="mt-1 font-semibold">
                                            {tool.primary_location?.name ??
                                                "Belum ditentukan"}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <Panel className="mt-5 overflow-hidden">
                        <Pagination links={tools.links} />
                    </Panel>
                </>
            ) : (
                <Panel>
                    <EmptyState
                        title="Alat tidak ditemukan"
                        description="Ubah kata kunci atau filter kategori."
                    />
                </Panel>
            )}
        </TamsLayout>
    );
}
