import { Head, Link, router } from "@inertiajs/react";
import {
    Filter,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
    locations,
    filters,
}: {
    tools: { data: ToolType[]; links: any[] };
    categories: any[];
    locations: Array<{ id: number; name: string }>;
    filters: CatalogFilters;
}) {
    const [q, setQ] = useState(filters.q ?? "");
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const advancedFilters = getAdvancedFilters(filters);
    const apply = (
        category = filters.category ?? "",
        advanced: AdvancedFilters = advancedFilters,
    ) =>
        router.get(
            "/katalog",
            cleanParams({ q, category, ...advanced }),
            { preserveState: true, replace: true },
        );
    const removeAdvancedFilter = (field: AdvancedField) =>
        apply(filters.category ?? "", { ...advancedFilters, [field]: "" });
    const activeAdvanced = ADVANCED_FIELDS.filter(
        ({ key }) => advancedFilters[key],
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
                <div className="grid gap-3 md:grid-cols-[1fr_240px_auto_auto]">
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
                        onChange={(e) => apply(e.target.value, advancedFilters)}
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
                    <button
                        type="button"
                        onClick={() => setAdvancedOpen(true)}
                        className={`btn-secondary relative ${activeAdvanced.length ? "!border-amber !bg-amber/10" : ""}`}
                    >
                        <SlidersHorizontal size={17} />
                        Filter Lanjutan
                        {activeAdvanced.length > 0 && (
                            <span className="grid size-5 place-items-center rounded-full bg-ink font-num text-[10px] font-bold text-white">
                                {activeAdvanced.length}
                            </span>
                        )}
                    </button>
                </div>
                {activeAdvanced.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                        <span className="font-num text-[10px] font-bold uppercase tracking-[.15em] text-muted">
                            Filter aktif
                        </span>
                        {activeAdvanced.map(({ key, label }) => (
                            <button
                                type="button"
                                key={key}
                                onClick={() => removeAdvancedFilter(key)}
                                className="inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-amber/20"
                                title={`Hapus filter ${label}`}
                            >
                                <span className="text-muted">{label}:</span>
                                <span className="max-w-[220px] truncate">
                                    {formatFilterValue(
                                        key,
                                        advancedFilters[key],
                                        locations,
                                    )}
                                </span>
                                <X size={13} />
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => apply(filters.category ?? "", {})}
                            className="ml-auto text-xs font-bold text-red hover:underline"
                        >
                            Hapus semua
                        </button>
                    </div>
                )}
            </Panel>
            {advancedOpen && (
                <AdvancedFilterModal
                    initial={advancedFilters}
                    locations={locations}
                    close={() => setAdvancedOpen(false)}
                    apply={(values) => {
                        setAdvancedOpen(false);
                        apply(filters.category ?? "", values);
                    }}
                />
            )}
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
                        description="Ubah kata kunci, kategori, atau kriteria filter lanjutan."
                    />
                </Panel>
            )}
        </TamsLayout>
    );
}

type AdvancedField =
    | "item_no"
    | "item_name"
    | "item_unit"
    | "original_manufacture"
    | "manufacture_pn"
    | "article_no"
    | "specification"
    | "primary_location"
    | "availability";

type AdvancedFilters = Partial<Record<AdvancedField, string>>;
type CatalogFilters = AdvancedFilters & { q?: string; category?: string };

const ADVANCED_FIELDS: Array<{
    key: AdvancedField;
    label: string;
    placeholder: string;
}> = [
    { key: "item_no", label: "Item No", placeholder: "Contoh: 603840" },
    { key: "item_name", label: "Item Name", placeholder: "Nama item" },
    { key: "item_unit", label: "Item Unit", placeholder: "Contoh: PCS" },
    {
        key: "original_manufacture",
        label: "Original Manufacture",
        placeholder: "Nama pabrikan",
    },
    {
        key: "manufacture_pn",
        label: "Manufacture PN",
        placeholder: "Part number pabrikan",
    },
    { key: "article_no", label: "Article No", placeholder: "Nomor artikel" },
    {
        key: "specification",
        label: "Specification",
        placeholder: "Isi spesifikasi alat",
    },
    {
        key: "primary_location",
        label: "Lokasi Utama",
        placeholder: "Pilih lokasi",
    },
    {
        key: "availability",
        label: "Ketersediaan",
        placeholder: "Pilih status",
    },
];

function AdvancedFilterModal({
    initial,
    locations,
    close,
    apply,
}: {
    initial: AdvancedFilters;
    locations: Array<{ id: number; name: string }>;
    close: () => void;
    apply: (filters: AdvancedFilters) => void;
}) {
    const initialFields = ADVANCED_FIELDS.filter(({ key }) => initial[key]).map(
        ({ key }) => key,
    );
    const [selected, setSelected] = useState<AdvancedField[]>(
        initialFields.length ? initialFields : ["item_no"],
    );
    const [values, setValues] = useState<AdvancedFilters>(initial);
    const [nextField, setNextField] = useState<AdvancedField | "">("");
    const availableFields = useMemo(
        () => ADVANCED_FIELDS.filter(({ key }) => !selected.includes(key)),
        [selected],
    );

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
        };
        document.addEventListener("keydown", onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [close]);

    const remove = (field: AdvancedField) => {
        setSelected((current) => current.filter((key) => key !== field));
        setValues((current) => ({ ...current, [field]: "" }));
    };

    return (
        <div
            className="fixed inset-0 z-[100] grid place-items-center bg-ink/70 p-3 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="advanced-filter-title"
            onMouseDown={(event) => event.target === event.currentTarget && close()}
        >
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-white/15 bg-surface shadow-2xl">
                <div className="flex items-start justify-between gap-5 border-b border-line bg-ink p-5 text-white sm:p-6">
                    <div className="flex items-start gap-4">
                        <span className="grid size-11 shrink-0 place-items-center rounded-md border border-amber/50 bg-amber text-ink">
                            <SlidersHorizontal size={22} />
                        </span>
                        <div>
                            <p className="font-num text-[10px] font-bold uppercase tracking-[.18em] text-amber">
                                Precision search
                            </p>
                            <h2
                                id="advanced-filter-title"
                                className="mt-1 font-display text-3xl font-bold"
                            >
                                Filter Lanjutan
                            </h2>
                            <p className="mt-1 max-w-xl text-sm text-white/60">
                                Gabungkan beberapa kriteria. Semua kondisi akan
                                diterapkan bersamaan.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        className="grid size-9 shrink-0 place-items-center rounded-md border border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                        aria-label="Tutup filter lanjutan"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto p-5 sm:p-6">
                    <div className="flex flex-col gap-2 rounded-md border border-line bg-canvas p-3 sm:flex-row">
                        <select
                            className="control flex-1"
                            value={nextField}
                            onChange={(event) =>
                                setNextField(event.target.value as AdvancedField)
                            }
                        >
                            <option value="">Pilih kriteria tambahan...</option>
                            {availableFields.map(({ key, label }) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            disabled={!nextField}
                            onClick={() => {
                                if (!nextField) return;
                                setSelected((current) => [
                                    ...current,
                                    nextField,
                                ]);
                                setNextField("");
                            }}
                            className="btn-secondary shrink-0"
                        >
                            <Plus size={16} />
                            Tambah Kriteria
                        </button>
                    </div>

                    <div className="mt-5 space-y-3">
                        {selected.map((field, index) => {
                            const meta = ADVANCED_FIELDS.find(
                                ({ key }) => key === field,
                            )!;
                            return (
                                <div
                                    key={field}
                                    className="grid gap-3 rounded-md border border-line bg-surface p-4 sm:grid-cols-[34px_180px_1fr_auto] sm:items-center"
                                >
                                    <span className="grid size-8 place-items-center rounded bg-ink font-num text-[11px] font-bold text-white">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <div>
                                        <span className="font-num text-[10px] font-bold uppercase tracking-[.12em] text-muted">
                                            Field
                                        </span>
                                        <strong className="mt-1 block text-sm">
                                            {meta.label}
                                        </strong>
                                    </div>
                                    <FilterValueInput
                                        field={field}
                                        value={values[field] ?? ""}
                                        placeholder={meta.placeholder}
                                        locations={locations}
                                        set={(value) =>
                                            setValues((current) => ({
                                                ...current,
                                                [field]: value,
                                            }))
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() => remove(field)}
                                        className="btn-secondary !min-h-10 !border-red/25 !px-3 !text-red"
                                        aria-label={`Hapus filter ${meta.label}`}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            );
                        })}
                        {!selected.length && (
                            <div className="rounded-md border border-dashed border-line bg-canvas p-8 text-center text-sm text-muted">
                                Pilih kriteria di atas untuk mulai menyusun
                                filter.
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-2 border-t border-line bg-canvas p-4 sm:grid-cols-[auto_1fr_auto] sm:p-5">
                    <button
                        type="button"
                        onClick={() => {
                            setSelected([]);
                            setValues({});
                        }}
                        className="btn-secondary !text-red"
                    >
                        Reset
                    </button>
                    <span />
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={close} className="btn-secondary">
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => apply(values)}
                            className="btn-primary"
                        >
                            <Filter size={16} />
                            Terapkan Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FilterValueInput({
    field,
    value,
    placeholder,
    locations,
    set,
}: {
    field: AdvancedField;
    value: string;
    placeholder: string;
    locations: Array<{ id: number; name: string }>;
    set: (value: string) => void;
}) {
    if (field === "primary_location") {
        return (
            <SearchableSelect
                value={value}
                onChange={(event) => set(event.target.value)}
            >
                <option value="">Semua lokasi</option>
                {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                        {location.name}
                    </option>
                ))}
            </SearchableSelect>
        );
    }
    if (field === "availability") {
        return (
            <select
                className="control"
                value={value}
                onChange={(event) => set(event.target.value)}
            >
                <option value="">Semua status</option>
                <option value="available">Tersedia</option>
                <option value="unavailable">Tidak tersedia</option>
            </select>
        );
    }
    return (
        <input
            className="control"
            value={value}
            onChange={(event) => set(event.target.value)}
            placeholder={placeholder}
            autoFocus={field === "item_no"}
        />
    );
}

function getAdvancedFilters(filters: CatalogFilters): AdvancedFilters {
    return Object.fromEntries(
        ADVANCED_FIELDS.map(({ key }) => [key, filters[key] ?? ""]),
    ) as AdvancedFilters;
}

function cleanParams(values: Record<string, string | undefined>) {
    return Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== "" && value != null),
    );
}

function formatFilterValue(
    field: AdvancedField,
    value: string | undefined,
    locations: Array<{ id: number; name: string }>,
) {
    if (field === "primary_location") {
        return locations.find((location) => String(location.id) === value)?.name ?? value;
    }
    if (field === "availability") {
        return value === "available" ? "Tersedia" : "Tidak tersedia";
    }
    return value;
}
