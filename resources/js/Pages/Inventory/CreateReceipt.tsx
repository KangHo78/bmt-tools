import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Check,
    ClipboardList,
    FileText,
    PackagePlus,
    Plus,
    Search,
    Trash2,
    UserRound,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import SearchableSelect from "@/Components/SearchableSelect";
import { PageHeader, Panel } from "@/Components/TamsUI";

type ToolTypeOption = {
    id: number;
    code: string;
    name: string;
    unit?: string;
    primary_location_id?: number | null;
};
type LocationOption = { id: number; name: string };
type OwnerUser = { id: number; name: string; username: string; email?: string };
type NpbItem = {
    id: number;
    tool_type_id: number;
    item_no: string;
    item_name: string;
    unit?: string;
    quantity: number;
    primary_location_id?: number | null;
};
type Npb = {
    id: number;
    reference: string;
    requester?: string;
    date?: string;
    items: NpbItem[];
};
type ReceiptItem = {
    key: string;
    tool_type_id: string;
    location_id: string;
    received_quantity: number;
    initial_condition: string;
    source_npb_id?: number;
    source_npb_item_id?: number;
    source_reference?: string;
};

const blankComposer = () => ({
    tool_type_id: "",
    location_id: "",
    received_quantity: 1,
    initial_condition: "baik",
});

export default function CreateReceipt({
    toolTypes,
    locations,
    ownerUsers,
    npbs,
    ssoUnavailable,
}: {
    toolTypes: ToolTypeOption[];
    locations: LocationOption[];
    ownerUsers: OwnerUser[];
    npbs: Npb[];
    ssoUnavailable: boolean;
}) {
    const [form, setForm] = useState({
        request_reference: "",
        owner_sso_user_id: "",
        received_date: new Date().toISOString().slice(0, 10),
        notes: "",
    });
    const [composer, setComposer] = useState(blankComposer());
    const [items, setItems] = useState<ReceiptItem[]>([]);
    const [document, setDocument] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [composerError, setComposerError] = useState("");
    const [npbOpen, setNpbOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const updateItem = (
        key: string,
        field: keyof ReceiptItem,
        value: string | number,
    ) =>
        setItems((current) =>
            current.map((item) =>
                item.key === key ? { ...item, [field]: value } : item,
            ),
        );

    const appendManualItem = () => {
        if (!composer.tool_type_id || !composer.location_id) {
            setComposerError("Pilih jenis alat dan lokasi sebelum menambahkan item.");
            return;
        }
        if (composer.received_quantity < 1 || composer.received_quantity > 100) {
            setComposerError("Qty diterima harus antara 1 sampai 100.");
            return;
        }
        setItems((current) => [
            ...current,
            { ...composer, key: makeKey("manual") },
        ]);
        setComposer(blankComposer());
        setComposerError("");
    };

    const appendNpbs = (selectedNpbs: Npb[]) => {
        const existingIds = new Set(
            items.map((item) => item.source_npb_item_id).filter(Boolean),
        );
        const appended = selectedNpbs.flatMap((npb) =>
            npb.items
                .filter((item) => !existingIds.has(item.id))
                .map(
                    (item): ReceiptItem => ({
                        key: makeKey(`npb-${item.id}`),
                        tool_type_id: String(item.tool_type_id),
                        location_id: item.primary_location_id
                            ? String(item.primary_location_id)
                            : "",
                        received_quantity: Math.min(
                            100,
                            Math.max(1, item.quantity),
                        ),
                        initial_condition: "baik",
                        source_npb_id: npb.id,
                        source_npb_item_id: item.id,
                        source_reference: npb.reference,
                    }),
                ),
        );
        setItems((current) => [...current, ...appended]);
        setForm((current) => ({
            ...current,
            request_reference:
                current.request_reference ||
                selectedNpbs
                    .map((npb) => npb.reference)
                    .join(", ")
                    .slice(0, 100),
        }));
        setNpbOpen(false);
    };

    const submit = () => {
        const fd = new FormData();
        Object.entries(form).forEach(([key, value]) => fd.append(key, value));
        items.forEach((item, index) =>
            Object.entries(item).forEach(([key, value]) => {
                if (key !== "key" && value !== undefined && value !== "") {
                    fd.append(`items[${index}][${key}]`, String(value));
                }
            }),
        );
        if (document) fd.append("document", document);
        setProcessing(true);
        setErrors({});
        router.post("/inventaris/penerimaan", fd, {
            forceFormData: true,
            preserveScroll: true,
            onError: setErrors,
            onFinish: () => setProcessing(false),
        });
    };

    const invalidItems = items.some(
        (item) =>
            !item.tool_type_id ||
            !item.location_id ||
            item.received_quantity < 1 ||
            item.received_quantity > 100,
    );

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
                description="Susun manifest penerimaan, periksa jumlah aktual, lalu buat kode aset dalam satu proses."
            />

            {ssoUnavailable && (
                <div className="mb-5 rounded-md border border-amber/40 bg-amber/10 p-4 text-sm text-ink">
                    Koneksi BMT Multi sedang tidak tersedia. Pilihan owner dan
                    sumber NPB belum dapat dimuat.
                </div>
            )}

            <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
                <Panel className="h-fit overflow-hidden">
                    <SectionHeader
                        icon={<FileText size={20} />}
                        eyebrow="Receipt metadata"
                        title="Dokumen Penerimaan"
                    />
                    <div className="space-y-4 p-5">
                        <Field
                            label="Owner / Lembaga"
                            error={errors.owner_sso_user_id}
                        >
                            <SearchableSelect
                                value={form.owner_sso_user_id}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        owner_sso_user_id: event.target.value,
                                    })
                                }
                                disabled={ssoUnavailable}
                            >
                                <option value="">Pilih user BMT Multi...</option>
                                {ownerUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name || user.username} · {user.username}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </Field>
                        <Field label="Referensi permohonan">
                            <input
                                className="control"
                                value={form.request_reference}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        request_reference: event.target.value,
                                    })
                                }
                                placeholder="Otomatis terisi saat mengambil NPB"
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
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        received_date: event.target.value,
                                    })
                                }
                            />
                        </Field>
                        <Field
                            label="Dokumen pendukung"
                            hint="Opsional · PDF, JPG, atau PNG maksimal 5 MB"
                            error={errors.document}
                        >
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="control"
                                onChange={(event) =>
                                    setDocument(event.target.files?.[0] ?? null)
                                }
                            />
                        </Field>
                        <Field label="Catatan">
                            <textarea
                                className="control min-h-24"
                                value={form.notes}
                                onChange={(event) =>
                                    setForm({ ...form, notes: event.target.value })
                                }
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel className="h-fit overflow-hidden">
                    <SectionHeader
                        icon={<PackagePlus size={20} />}
                        eyebrow="Item composer"
                        title="Tools and Quantities"
                        action={
                            <button
                                type="button"
                                onClick={() => setNpbOpen(true)}
                                disabled={ssoUnavailable || !npbs.length}
                                className="btn-secondary !border-amber/50 !bg-amber/10"
                            >
                                <ClipboardList size={16} />
                                Add from NPB
                            </button>
                        }
                    />
                    <div className="p-5">
                        <p className="mb-4 text-sm leading-relaxed text-muted">
                            Isi satu item manual di bawah, lalu tambahkan ke
                            tabel manifest. Data belum disimpan pada tahap ini.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Jenis alat">
                                <SearchableSelect
                                    value={composer.tool_type_id}
                                    onChange={(event) => {
                                        const tool = toolTypes.find(
                                            (item) =>
                                                String(item.id) ===
                                                event.target.value,
                                        );
                                        setComposer({
                                            ...composer,
                                            tool_type_id: event.target.value,
                                            location_id:
                                                composer.location_id ||
                                                String(
                                                    tool?.primary_location_id ??
                                                        "",
                                                ),
                                        });
                                    }}
                                >
                                    <option value="">Pilih jenis...</option>
                                    {toolTypes.map((tool) => (
                                        <option key={tool.id} value={tool.id}>
                                            {tool.code} · {tool.name}
                                        </option>
                                    ))}
                                </SearchableSelect>
                            </Field>
                            <Field label="Lokasi awal">
                                <SearchableSelect
                                    value={composer.location_id}
                                    onChange={(event) =>
                                        setComposer({
                                            ...composer,
                                            location_id: event.target.value,
                                        })
                                    }
                                >
                                    <option value="">Pilih lokasi...</option>
                                    {locations.map((location) => (
                                        <option
                                            key={location.id}
                                            value={location.id}
                                        >
                                            {location.name}
                                        </option>
                                    ))}
                                </SearchableSelect>
                            </Field>
                            <Field label="Kondisi awal">
                                <select
                                    className="control"
                                    value={composer.initial_condition}
                                    onChange={(event) =>
                                        setComposer({
                                            ...composer,
                                            initial_condition: event.target.value,
                                        })
                                    }
                                >
                                    <option value="baik">Baik</option>
                                    <option value="perlu_perhatian">
                                        Perlu perhatian
                                    </option>
                                    <option value="rusak">Rusak</option>
                                </select>
                            </Field>
                            <Field label="Qty received">
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    className="control"
                                    value={composer.received_quantity}
                                    onChange={(event) =>
                                        setComposer({
                                            ...composer,
                                            received_quantity: Number(
                                                event.target.value,
                                            ),
                                        })
                                    }
                                />
                            </Field>
                        </div>
                        {composerError && (
                            <p className="mt-3 rounded border border-red/25 bg-red/10 p-3 text-xs text-red">
                                {composerError}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={appendManualItem}
                            className="btn-primary mt-4 w-full"
                        >
                            <Plus size={17} />
                            Tambahkan ke Tabel
                        </button>
                    </div>
                </Panel>
            </div>

            <Panel className="mt-5 overflow-hidden">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-5">
                    <div>
                        <p className="label">Receiving manifest</p>
                        <h2 className="font-display text-2xl font-bold">
                            Item yang Akan Diterima
                        </h2>
                    </div>
                    <div className="rounded bg-ink px-3 py-2 font-num text-[11px] font-bold text-white">
                        {items.length} BARIS · {sumQuantity(items)} UNIT
                    </div>
                </div>
                {items.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="border-b border-line bg-canvas font-num text-[10px] uppercase tracking-[.12em] text-muted">
                                <tr>
                                    <th className="px-4 py-3">Item</th>
                                    <th className="px-4 py-3">Sumber</th>
                                    <th className="px-4 py-3">Lokasi awal</th>
                                    <th className="px-4 py-3">Kondisi</th>
                                    <th className="w-32 px-4 py-3">Qty received</th>
                                    <th className="w-16 px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {items.map((item) => {
                                    const tool = toolTypes.find(
                                        (option) =>
                                            String(option.id) ===
                                            item.tool_type_id,
                                    );
                                    return (
                                        <tr key={item.key} className="align-middle">
                                            <td className="px-4 py-4">
                                                <span className="block font-num text-[10px] font-bold text-green">
                                                    {tool?.code}
                                                </span>
                                                <strong>{tool?.name}</strong>
                                            </td>
                                            <td className="px-4 py-4">
                                                {item.source_reference ? (
                                                    <span className="rounded-full border border-amber/40 bg-amber/10 px-2.5 py-1 font-num text-[10px] font-bold">
                                                        {item.source_reference}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted">
                                                        Manual
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <SearchableSelect
                                                    value={item.location_id}
                                                    onChange={(event) =>
                                                        updateItem(
                                                            item.key,
                                                            "location_id",
                                                            event.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Pilih lokasi...
                                                    </option>
                                                    {locations.map((location) => (
                                                        <option
                                                            key={location.id}
                                                            value={location.id}
                                                        >
                                                            {location.name}
                                                        </option>
                                                    ))}
                                                </SearchableSelect>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    className="control"
                                                    value={item.initial_condition}
                                                    onChange={(event) =>
                                                        updateItem(
                                                            item.key,
                                                            "initial_condition",
                                                            event.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="baik">Baik</option>
                                                    <option value="perlu_perhatian">
                                                        Perlu perhatian
                                                    </option>
                                                    <option value="rusak">
                                                        Rusak
                                                    </option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    className="control font-num font-bold"
                                                    value={item.received_quantity}
                                                    onChange={(event) =>
                                                        updateItem(
                                                            item.key,
                                                            "received_quantity",
                                                            Number(
                                                                event.target.value,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setItems((current) =>
                                                            current.filter(
                                                                (row) =>
                                                                    row.key !==
                                                                    item.key,
                                                            ),
                                                        )
                                                    }
                                                    className="btn-secondary !min-h-10 !border-red/25 !px-3 !text-red"
                                                    aria-label={`Hapus ${tool?.name}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid min-h-48 place-items-center p-8 text-center">
                        <div>
                            <span className="mx-auto grid size-11 place-items-center rounded-full bg-canvas text-muted">
                                <ClipboardList size={20} />
                            </span>
                            <strong className="mt-3 block">Manifest masih kosong</strong>
                            <p className="mt-1 text-sm text-muted">
                                Tambahkan item manual atau ambil beberapa NPB.
                            </p>
                        </div>
                    </div>
                )}
                {(errors.items || invalidItems) && (
                    <p className="border-t border-red/20 bg-red/10 p-3 text-sm text-red">
                        {errors.items ||
                            "Lengkapi lokasi dan qty setiap item sebelum menyimpan."}
                    </p>
                )}
            </Panel>

            <Panel className="mt-5 flex flex-col gap-4 border-t-4 !border-t-green p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="font-display text-xl font-bold">
                        Siap menyimpan penerimaan?
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        Sistem akan membuat {sumQuantity(items)} kode aset baru
                        setelah data disimpan.
                    </p>
                </div>
                <button
                    type="button"
                    disabled={
                        processing ||
                        !form.owner_sso_user_id ||
                        !items.length ||
                        invalidItems
                    }
                    onClick={submit}
                    className="btn-primary min-w-64"
                >
                    <Check size={17} />
                    {processing ? "Menyimpan..." : "Simpan Penerimaan"}
                </button>
            </Panel>

            {npbOpen && (
                <NpbModal
                    npbs={npbs}
                    existingItemIds={new Set(
                        items
                            .map((item) => item.source_npb_item_id)
                            .filter((id): id is number => Boolean(id)),
                    )}
                    close={() => setNpbOpen(false)}
                    append={appendNpbs}
                />
            )}
        </TamsLayout>
    );
}

function NpbModal({
    npbs,
    existingItemIds,
    close,
    append,
}: {
    npbs: Npb[];
    existingItemIds: Set<number>;
    close: () => void;
    append: (npbs: Npb[]) => void;
}) {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<number[]>([]);
    const filtered = useMemo(
        () =>
            npbs.filter((npb) =>
                [npb.reference, npb.requester, ...npb.items.map((i) => i.item_name)]
                    .join(" ")
                    .toLocaleLowerCase("id")
                    .includes(query.toLocaleLowerCase("id")),
            ),
        [npbs, query],
    );

    useEffect(() => {
        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
        };
        document.addEventListener("keydown", escape);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", escape);
            document.body.style.overflow = overflow;
        };
    }, [close]);

    const chosen = npbs.filter((npb) => selected.includes(npb.id));

    return (
        <div
            className="fixed inset-0 z-[100] grid place-items-center bg-ink/70 p-3 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="npb-modal-title"
            onMouseDown={(event) => event.target === event.currentTarget && close()}
        >
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-white/15 bg-surface shadow-2xl">
                <div className="flex items-start justify-between gap-4 bg-ink p-5 text-white sm:p-6">
                    <div className="flex items-start gap-4">
                        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-amber text-ink">
                            <ClipboardList size={22} />
                        </span>
                        <div>
                            <p className="font-num text-[10px] font-bold uppercase tracking-[.18em] text-amber">
                                BMT Multi source
                            </p>
                            <h2
                                id="npb-modal-title"
                                className="mt-1 font-display text-3xl font-bold"
                            >
                                Pilih NPB
                            </h2>
                            <p className="mt-1 text-sm text-white/60">
                                Pilih beberapa NPB sekaligus. Hanya item yang
                                terhubung ke Master Aset yang ditampilkan.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        className="grid size-9 place-items-center rounded border border-white/20 text-white/70 hover:bg-white/10"
                        aria-label="Tutup modal NPB"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="border-b border-line p-4 sm:p-5">
                    <div className="relative">
                        <Search
                            size={17}
                            className="absolute left-3 top-3.5 text-muted"
                        />
                        <input
                            className="control pl-10"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Cari nomor NPB, peminta, atau nama item..."
                            autoFocus
                        />
                    </div>
                </div>

                <div className="overflow-y-auto bg-canvas p-3 sm:p-5">
                    <div className="space-y-3">
                        {filtered.map((npb) => {
                            const availableItems = npb.items.filter(
                                (item) => !existingItemIds.has(item.id),
                            );
                            const checked = selected.includes(npb.id);
                            const disabled = !availableItems.length;
                            return (
                                <button
                                    type="button"
                                    key={npb.id}
                                    disabled={disabled}
                                    onClick={() =>
                                        setSelected((current) =>
                                            checked
                                                ? current.filter(
                                                      (id) => id !== npb.id,
                                                  )
                                                : [...current, npb.id],
                                        )
                                    }
                                    className={`grid w-full gap-4 rounded-md border p-4 text-left transition-colors sm:grid-cols-[auto_190px_1fr] ${
                                        checked
                                            ? "border-green bg-green/10"
                                            : "border-line bg-surface hover:border-amber"
                                    } disabled:cursor-not-allowed disabled:opacity-45`}
                                >
                                    <span
                                        className={`mt-0.5 grid size-6 place-items-center rounded border-2 ${
                                            checked
                                                ? "border-green bg-green text-white"
                                                : "border-line bg-canvas"
                                        }`}
                                    >
                                        {checked && <Check size={14} />}
                                    </span>
                                    <span>
                                        <strong className="block font-num text-xs">
                                            {npb.reference}
                                        </strong>
                                        <small className="mt-1 block text-muted">
                                            <UserRound
                                                size={12}
                                                className="mr-1 inline"
                                            />
                                            {npb.requester || "Tanpa peminta"}
                                        </small>
                                        <small className="mt-1 block text-muted">
                                            {formatDate(npb.date)}
                                        </small>
                                    </span>
                                    <span className="space-y-1.5">
                                        {npb.items.slice(0, 3).map((item) => (
                                            <span
                                                key={item.id}
                                                className="flex items-center justify-between gap-3 text-xs"
                                            >
                                                <span className="min-w-0 truncate">
                                                    <b className="font-num">
                                                        {item.item_no}
                                                    </b>{" "}
                                                    · {item.item_name}
                                                </span>
                                                <b className="shrink-0 font-num">
                                                    {item.quantity} {item.unit}
                                                </b>
                                            </span>
                                        ))}
                                        {npb.items.length > 3 && (
                                            <small className="block text-muted">
                                                +{npb.items.length - 3} item lainnya
                                            </small>
                                        )}
                                        {disabled && (
                                            <small className="block font-semibold text-amber">
                                                Semua item sudah ditambahkan
                                            </small>
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                        {!filtered.length && (
                            <p className="p-10 text-center text-sm text-muted">
                                NPB tidak ditemukan.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <span className="font-num text-xs font-bold text-muted">
                        {chosen.length} NPB ·{" "}
                        {chosen.reduce(
                            (total, npb) => total + npb.items.length,
                            0,
                        )}{" "}
                        ITEM DIPILIH
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={close} className="btn-secondary">
                            Batal
                        </button>
                        <button
                            type="button"
                            disabled={!chosen.length}
                            onClick={() => append(chosen)}
                            className="btn-primary"
                        >
                            <Plus size={16} />
                            Tambahkan Item
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionHeader({
    icon,
    eyebrow,
    title,
    action,
}: {
    icon: ReactNode;
    eyebrow: string;
    title: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas p-5">
            <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-md bg-ink text-amber">
                    {icon}
                </span>
                <div>
                    <p className="font-num text-[10px] font-bold uppercase tracking-[.15em] text-muted">
                        {eyebrow}
                    </p>
                    <h2 className="mt-0.5 font-display text-2xl font-bold">
                        {title}
                    </h2>
                </div>
            </div>
            {action}
        </div>
    );
}

function Field({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="label">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
            {error && <span className="mt-1 block text-xs text-red">{error}</span>}
        </label>
    );
}

function makeKey(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sumQuantity(items: ReceiptItem[]) {
    return items.reduce(
        (total, item) => total + (Number(item.received_quantity) || 0),
        0,
    );
}

function formatDate(value?: string) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}
