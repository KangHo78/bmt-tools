import { Head, router } from "@inertiajs/react";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    FileText,
    KeyRound,
    MapPin,
    Minus,
    PackagePlus,
    Plus,
    Search,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import SearchableSelect from "@/Components/SearchableSelect";
import { AssetVisual, PageHeader, Panel } from "@/Components/TamsUI";
import type { ToolType } from "@/types/tams";

type Borrower = {
    id: number;
    name: string;
    identifier?: string;
    institution?: string;
    phone?: string;
    email?: string;
    has_account: boolean;
    tokens: { id: number; code: string; status: string }[];
};

type LoanTool = ToolType & {
    approval_unit_id: number;
    approval_unit_code: string;
    approval_owner?: string;
    approval_owner_sso_user_id?: number;
    available_units: Array<{
        id: number;
        asset_code: string;
        owner?: string;
        owner_sso_user_id?: number;
    }>;
};

type ChosenLine = {
    key: string;
    tool: LoanTool;
    unit: LoanTool["available_units"][number];
    ordinal: number;
};

export default function Create({
    tools,
    preselected,
    borrowers,
    canChooseBorrower,
    selectedBorrowerId,
    logisticsApprovers,
    outsideOwnerApprovalRequired,
}: {
    tools: LoanTool[];
    preselected: number[];
    borrowers: Borrower[];
    canChooseBorrower: boolean;
    selectedBorrowerId: number;
    logisticsApprovers: { id: number; name: string }[];
    outsideOwnerApprovalRequired: boolean;
}) {
    const [step, setStep] = useState(1),
        [selected, setSelected] = useState<number[]>(preselected),
        [quantities, setQuantities] = useState<Record<number, number>>(
            Object.fromEntries(preselected.map((id) => [id, 1])),
        ),
        [toolQuery, setToolQuery] = useState("");
    const [usage, setUsage] = useState<"dalam_area" | "luar_area">(
        "dalam_area",
    );
    const [purpose, setPurpose] = useState(""),
        [location, setLocation] = useState(""),
        [start, setStart] = useState(new Date().toISOString().slice(0, 10)),
        [due, setDue] = useState("");
    const [letter, setLetter] = useState<File | null>(null),
        [borrowerId, setBorrowerId] = useState(selectedBorrowerId),
        [newBorrower, setNewBorrower] = useState(false);
    const [guest, setGuest] = useState({
            name: "",
            identifier: "",
            institution: "",
            phone: "",
        }),
        [tokenCodes, setTokenCodes] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({}),
        [processing, setProcessing] = useState(false);
    const chosen = useMemo(
            () => tools.filter((t) => selected.includes(t.id)),
            [selected, tools],
        ),
        chosenLines = useMemo<ChosenLine[]>(
            () =>
                chosen.flatMap((tool) =>
                    tool.available_units
                        .slice(0, quantities[tool.id] ?? 1)
                        .map((unit, index) => ({
                            key: `${tool.id}-${index}`,
                            tool,
                            unit,
                            ordinal: index + 1,
                        })),
                ),
            [chosen, quantities],
        ),
        filteredTools = useMemo(() => {
            const query = toolQuery.trim().toLocaleLowerCase("id-ID");
            if (!query) return tools;
            return tools.filter((tool) =>
                `${tool.code} ${tool.name}`
                    .toLocaleLowerCase("id-ID")
                    .includes(query),
            );
        }, [toolQuery, tools]),
        borrower = borrowers.find((b) => b.id === borrowerId);
    const availableTokens =
        borrower?.tokens.filter(
            (token) => token.status === "dipegang_peminjam",
        ) ?? [];
    const toggle = (id: number) => {
        if (selected.includes(id)) {
            setTokenCodes((codes) => {
                return Object.fromEntries(
                    Object.entries(codes).filter(
                        ([key]) => !key.startsWith(`${id}-`),
                    ),
                );
            });
            setQuantities((current) => {
                const next = { ...current };
                delete next[id];
                return next;
            });
        } else {
            setQuantities((current) => ({ ...current, [id]: 1 }));
        }
        setSelected((items) =>
            items.includes(id)
                ? items.filter((item) => item !== id)
                : [...items, id],
        );
    };
    const changeQuantity = (tool: LoanTool, delta: number) => {
        const current = quantities[tool.id] ?? 1;
        const next = Math.min(
            tool.available_units.length,
            Math.max(1, current + delta),
        );
        setQuantities((values) => ({ ...values, [tool.id]: next }));
        if (next < current) {
            setTokenCodes((codes) =>
                Object.fromEntries(
                    Object.entries(codes).filter(([key]) => {
                        const [typeId, index] = key.split("-").map(Number);
                        return typeId !== tool.id || index < next;
                    }),
                ),
            );
        }
    };
    const changeBorrower = (value: string) => {
        setTokenCodes({});
        if (value === "guest") {
            setNewBorrower(true);
            return;
        }
        setNewBorrower(false);
        setBorrowerId(Number(value));
    };
    const submit = () => {
        const data = new FormData();
        chosenLines.forEach((line, index) => {
            data.append(`tool_type_ids[${index}]`, String(line.tool.id));
            data.append(`tool_unit_ids[${index}]`, String(line.unit.id));
            data.append(`token_codes[${index}]`, tokenCodes[line.key] || "");
        });
        data.append("usage_type", usage);
        data.append("purpose", purpose);
        data.append("location_text", location);
        data.append("start_date", start);
        if (due) data.append("due_date", due);
        if (letter) data.append("letter", letter);
        if (canChooseBorrower) {
            if (newBorrower)
                Object.entries(guest).forEach(([k, v]) =>
                    data.append(`new_borrower[${k}]`, v),
                );
            else data.append("borrower_id", String(borrowerId));
        }
        setProcessing(true);
        router.post("/peminjaman", data, {
            forceFormData: true,
            onError: (e: any) => {
                setErrors(e);
                setStep(
                    e.tool_type_ids ||
                        e.tool_unit_ids ||
                        Object.keys(e).some((key) =>
                            key.startsWith("tool_unit_ids."),
                        )
                        ? 1
                        : e.token_codes ||
                            Object.keys(e).some((k) =>
                                k.startsWith("token_codes."),
                            )
                          ? 4
                          : 3,
                );
            },
            onFinish: () => setProcessing(false),
        });
    };
    return (
        <TamsLayout>
            <Head title="Pinjaman Baru" />
            <PageHeader
                eyebrow="New loan request"
                title={
                    canChooseBorrower ? "Input Peminjaman" : "Ajukan Peminjaman"
                }
                description={
                    canChooseBorrower
                        ? "Layani peminjam berakun maupun tamu. Satu kepingan token unik ditukar untuk setiap alat."
                        : "Masukkan satu kode token fisik milik Anda untuk setiap jenis alat."
                }
            />
            {canChooseBorrower && (
                <Panel className="mb-6 overflow-hidden border-l-4 !border-l-amber">
                    <div className="grid gap-4 p-5 md:grid-cols-[auto_minmax(0,1fr)_220px] md:items-end">
                        <span className="grid size-12 place-items-center rounded-md bg-ink text-white">
                            <UserRound size={22} />
                        </span>
                        <Field
                            label="Peminjam"
                            error={
                                errors.borrower_id ||
                                errors["new_borrower.name"]
                            }
                        >
                            <SearchableSelect
                                className="control"
                                value={newBorrower ? "guest" : borrowerId}
                                onChange={(e) => changeBorrower(e.target.value)}
                            >
                                <option value="guest">
                                    + Peminjam tanpa akun / tamu
                                </option>
                                {borrowers.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} ·{" "}
                                        {b.institution ||
                                            b.email ||
                                            "Tanpa akun"}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </Field>
                        <div className="rounded-md border border-line bg-canvas/60 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                Token tersedia
                            </p>
                            <p className="mt-1 font-num text-2xl font-semibold">
                                {newBorrower ? 0 : availableTokens.length}
                            </p>
                        </div>
                    </div>
                </Panel>
            )}
            {canChooseBorrower && newBorrower && (
                <Panel className="mb-6 p-5">
                    <p className="label">Profil peminjam tanpa akun</p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <Field label="Nama lengkap *">
                            <input
                                className="control"
                                value={guest.name}
                                onChange={(e) =>
                                    setGuest({ ...guest, name: e.target.value })
                                }
                            />
                        </Field>
                        <Field label="NIK / NRP / identitas">
                            <input
                                className="control"
                                value={guest.identifier}
                                onChange={(e) =>
                                    setGuest({
                                        ...guest,
                                        identifier: e.target.value,
                                    })
                                }
                            />
                        </Field>
                        <Field label="Unit / perusahaan">
                            <input
                                className="control"
                                value={guest.institution}
                                onChange={(e) =>
                                    setGuest({
                                        ...guest,
                                        institution: e.target.value,
                                    })
                                }
                            />
                        </Field>
                        <Field label="Nomor telepon">
                            <input
                                className="control"
                                value={guest.phone}
                                onChange={(e) =>
                                    setGuest({
                                        ...guest,
                                        phone: e.target.value,
                                    })
                                }
                            />
                        </Field>
                    </div>
                </Panel>
            )}
            <div className="mb-6 grid grid-cols-4 overflow-hidden rounded-lg border bg-surface">
                {["Pilih Alat", "Area Pakai", "Detail", "Token & Tinjau"].map(
                    (label, i) => (
                        <div
                            key={label}
                            className={`px-2 py-3 text-center text-xs font-bold ${step === i + 1 ? "bg-ink text-white" : step > i + 1 ? "bg-green/10 text-green" : "text-muted"}`}
                        >
                            <span className="mr-2 font-num">
                                {step > i + 1 ? "✓" : i + 1}
                            </span>
                            {label}
                        </div>
                    ),
                )}
            </div>
            {step === 1 && (
                <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                    <Panel className="overflow-hidden">
                        <div className="border-b p-5">
                            <h2 className="font-display text-2xl font-bold">
                                Pilih Jenis Alat
                            </h2>
                            <p className="text-sm text-muted">
                                Setiap unit alat membutuhkan satu token fisik.
                            </p>
                            <label className="relative mt-4 block">
                                <Search
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                    size={17}
                                />
                                <input
                                    type="search"
                                    className="control pl-10"
                                    value={toolQuery}
                                    onChange={(event) =>
                                        setToolQuery(event.target.value)
                                    }
                                    placeholder="Cari kode atau nama barang..."
                                    aria-label="Cari kode atau nama barang"
                                />
                            </label>
                        </div>
                        <div className="grid gap-3 p-4 sm:grid-cols-2">
                            {filteredTools.map((tool) => {
                                const active = selected.includes(tool.id);
                                const quantity = quantities[tool.id] ?? 1;
                                const selectedUnits =
                                    tool.available_units.slice(0, quantity);
                                const hasOwner = selectedUnits.every((unit) =>
                                    Boolean(unit.owner_sso_user_id),
                                );
                                return (
                                    <div
                                        key={tool.id}
                                        onClick={() => toggle(tool.id)}
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === "Enter" ||
                                                event.key === " "
                                            ) {
                                                event.preventDefault();
                                                toggle(tool.id);
                                            }
                                        }}
                                        role="checkbox"
                                        aria-checked={active}
                                        tabIndex={0}
                                        className={`group cursor-pointer overflow-hidden rounded-lg border text-left transition ${active ? "border-green ring-2 ring-green/15" : "bg-white hover:border-ink"}`}
                                    >
                                        <div className="grid grid-cols-[92px_1fr]">
                                            <AssetVisual
                                                code={tool.code}
                                                imageUrl={
                                                    tool.catalog_image_url
                                                }
                                                alt={tool.name}
                                                className="h-full !aspect-auto min-h-[112px]"
                                            />
                                            <div className="p-3">
                                                <p className="font-num text-[10px] text-muted">
                                                    {tool.code}
                                                </p>
                                                <h3 className="font-display text-lg font-bold leading-tight">
                                                    {tool.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-green">
                                                    {tool.available_count}{" "}
                                                    tersedia
                                                </p>
                                                {outsideOwnerApprovalRequired &&
                                                    !hasOwner && (
                                                        <p className="mt-1 text-xs font-semibold text-red">
                                                            Hanya dapat dipinjam
                                                            di dalam workshop
                                                        </p>
                                                    )}
                                            </div>
                                        </div>
                                        {active && (
                                            <div className="flex items-center justify-between gap-3 bg-green px-3 py-2 text-xs font-bold text-white">
                                                <span className="flex items-center gap-2">
                                                    <Check size={14} />
                                                    Dipilih · {quantity} token
                                                    fisik
                                                </span>
                                                <span
                                                    className="flex items-center overflow-hidden rounded border border-white/35 bg-white/10"
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                    onKeyDown={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            changeQuantity(
                                                                tool,
                                                                -1,
                                                            )
                                                        }
                                                        disabled={quantity <= 1}
                                                        className="grid size-8 place-items-center hover:bg-white/15 disabled:opacity-35"
                                                        aria-label={`Kurangi jumlah ${tool.name}`}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <output className="grid min-w-9 place-items-center border-x border-white/35 px-2 font-num text-sm">
                                                        {quantity}
                                                    </output>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            changeQuantity(
                                                                tool,
                                                                1,
                                                            )
                                                        }
                                                        disabled={
                                                            quantity >=
                                                            tool.available_units
                                                                .length
                                                        }
                                                        className="grid size-8 place-items-center hover:bg-white/15 disabled:opacity-35"
                                                        aria-label={`Tambah jumlah ${tool.name}`}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {!filteredTools.length && (
                                <div className="rounded-lg border border-dashed border-line bg-canvas p-8 text-center sm:col-span-2">
                                    <p className="font-display text-xl font-bold">
                                        Barang tidak ditemukan
                                    </p>
                                    <p className="mt-1 text-sm text-muted">
                                        Coba gunakan kode atau nama barang yang
                                        berbeda.
                                    </p>
                                </div>
                            )}
                        </div>
                        {errors.tool_type_ids && (
                            <p className="px-5 pb-4 text-sm text-red">
                                {errors.tool_type_ids}
                            </p>
                        )}
                    </Panel>
                    <div>
                        <TokenRule />
                        <button
                            disabled={!selected.length}
                            onClick={() => setStep(2)}
                            className="btn-primary mt-4 w-full"
                        >
                            Pilih Area
                            <ArrowRight size={17} />
                        </button>
                    </div>
                </div>
            )}
            {step === 2 && (
                <Panel className="mx-auto max-w-3xl p-6">
                    <h2 className="font-display text-3xl font-bold">
                        Di mana alat digunakan?
                    </h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <Usage
                            active={usage === "dalam_area"}
                            onClick={() => setUsage("dalam_area")}
                            icon={MapPin}
                            title="Dalam Workshop"
                            desc="Langsung siap diserahterimakan tanpa persetujuan. Tenggat Jumat terdekat."
                        />
                        <Usage
                            active={usage === "luar_area"}
                            onClick={() => setUsage("luar_area")}
                            icon={FileText}
                            title="Luar Workshop"
                            desc={
                                outsideOwnerApprovalRequired
                                    ? "Memerlukan periode, surat, approval owner, dan Kepala Logistik."
                                    : "Memerlukan periode, surat, dan approval Kepala Logistik. Approval owner dilewati."
                            }
                        />
                    </div>
                    <Actions back={() => setStep(1)} next={() => setStep(3)} />
                </Panel>
            )}
            {step === 3 && (
                <Panel className="mx-auto max-w-3xl p-6">
                    <h2 className="font-display text-3xl font-bold">
                        Detail Penggunaan
                    </h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <Field
                            wide
                            label="Tujuan penggunaan"
                            error={errors.purpose}
                        >
                            <textarea
                                className="control min-h-24"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                            />
                        </Field>
                        <Field
                            wide
                            label="Lokasi pekerjaan"
                            error={errors.location_text}
                        >
                            <input
                                className="control"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </Field>
                        <Field label="Tanggal mulai" error={errors.start_date}>
                            <input
                                type="date"
                                className="control"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                            />
                        </Field>
                        {usage === "luar_area" && (
                            <Field
                                label="Tanggal kembali"
                                error={errors.due_date}
                            >
                                <input
                                    type="date"
                                    className="control"
                                    value={due}
                                    onChange={(e) => setDue(e.target.value)}
                                />
                            </Field>
                        )}
                        {usage === "luar_area" && (
                            <Field
                                wide
                                label="Surat permohonan (PDF/JPG/PNG)"
                                error={errors.letter}
                            >
                                <input
                                    type="file"
                                    className="control"
                                    onChange={(e) =>
                                        setLetter(e.target.files?.[0] ?? null)
                                    }
                                />
                            </Field>
                        )}
                    </div>
                    {usage === "luar_area" && (
                        <div className="mt-6 overflow-hidden rounded-lg border border-amber/40 bg-canvas">
                            <div className="flex items-center gap-3 border-b border-amber/30 bg-ink px-5 py-4 text-white">
                                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-amber text-ink">
                                    <ShieldCheck size={20} />
                                </span>
                                <div>
                                    <p className="font-num text-[10px] font-bold uppercase tracking-[.16em] text-amber">
                                        Jalur persetujuan
                                    </p>
                                    <h3 className="font-display text-xl font-bold">
                                        {outsideOwnerApprovalRequired
                                            ? "Dua tahap sebelum alat diserahkan"
                                            : "Langsung ke Kepala Logistik"}
                                    </h3>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2">
                                <div className="border-b border-line p-5 md:border-b-0 md:border-r">
                                    <p
                                        className={`font-num text-[10px] font-bold uppercase tracking-wider ${outsideOwnerApprovalRequired ? "text-green" : "text-muted"}`}
                                    >
                                        {outsideOwnerApprovalRequired
                                            ? "Approval 01"
                                            : "Tahap dilewati"}
                                    </p>
                                    <h4 className="mt-1 font-display text-xl font-bold">
                                        Owner Aset
                                    </h4>
                                    {outsideOwnerApprovalRequired ? (
                                        <div className="mt-3 space-y-2">
                                            {chosenLines.map((line) => (
                                                <div
                                                    key={line.key}
                                                    className="rounded border bg-surface px-3 py-2"
                                                >
                                                    <p className="text-xs font-semibold">
                                                        {line.unit.owner ||
                                                            "Owner belum ditetapkan"}
                                                    </p>
                                                    <p className="mt-0.5 font-num text-[10px] text-muted">
                                                        {line.tool.name} ·{" "}
                                                        {line.unit.asset_code}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-3 rounded border border-dashed border-line bg-surface px-3 py-3 text-xs leading-relaxed text-muted">
                                            Dinonaktifkan melalui konfigurasi
                                            administrasi.
                                        </p>
                                    )}
                                </div>
                                <div className="p-5">
                                    <p className="font-num text-[10px] font-bold uppercase tracking-wider text-amber-ink">
                                        {outsideOwnerApprovalRequired
                                            ? "Approval 02"
                                            : "Approval akhir"}
                                    </p>
                                    <h4 className="mt-1 font-display text-xl font-bold">
                                        Kepala Logistik
                                    </h4>
                                    <p className="mt-3 text-sm font-semibold leading-relaxed">
                                        {logisticsApprovers.length
                                            ? logisticsApprovers
                                                  .map((item) => item.name)
                                                  .join(" / ")
                                            : "Belum dikonfigurasi"}
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-muted">
                                        {outsideOwnerApprovalRequired
                                            ? "Tahap ini aktif setelah seluruh owner aset menyetujui."
                                            : "Permohonan langsung masuk ke tahap ini setelah diajukan."}
                                    </p>
                                    {!logisticsApprovers.length && (
                                        <p className="mt-3 rounded border border-red/25 bg-red/10 p-2 text-xs font-semibold text-red">
                                            Administrator harus menetapkan
                                            approver logistik sebelum permohonan
                                            dapat dilanjutkan.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <Actions
                        back={() => setStep(2)}
                        next={() => setStep(4)}
                        disabled={
                            !purpose ||
                            !location ||
                            (usage === "luar_area" &&
                                (!due ||
                                    !letter ||
                                    !logisticsApprovers.length ||
                                    (outsideOwnerApprovalRequired &&
                                        chosenLines.some(
                                            (line) =>
                                                !line.unit.owner_sso_user_id,
                                        ))))
                        }
                    />
                </Panel>
            )}
            {step === 4 && (
                <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-[1fr_320px]">
                    <Panel className="p-6">
                        <p className="label">Pemeriksaan akhir</p>
                        <h2 className="font-display text-3xl font-bold">
                            Token dan Barang
                        </h2>
                        <div className="mt-5 space-y-3">
                            {chosenLines.map((line, index) => (
                                <div
                                    key={line.key}
                                    className="grid gap-3 rounded border bg-canvas/50 p-3 sm:grid-cols-[1fr_220px] sm:items-center"
                                >
                                    <div>
                                        <p className="font-display text-lg font-bold">
                                            {line.tool.name}
                                            {(quantities[line.tool.id] ?? 1) >
                                                1 && (
                                                <span className="ml-2 font-num text-xs text-muted">
                                                    #{line.ordinal}
                                                </span>
                                            )}
                                        </p>
                                        <p className="font-num text-xs text-muted">
                                            {line.tool.code} ·{" "}
                                            {line.unit.asset_code}
                                        </p>
                                    </div>
                                    <Field
                                        label="Kode token fisik"
                                        error={errors[`token_codes.${index}`]}
                                    >
                                        {canChooseBorrower && newBorrower ? (
                                            <input
                                                className="control font-num uppercase"
                                                placeholder="Contoh: 08-01"
                                                value={
                                                    tokenCodes[line.key] || ""
                                                }
                                                onChange={(e) =>
                                                    setTokenCodes({
                                                        ...tokenCodes,
                                                        [line.key]:
                                                            e.target.value.toUpperCase(),
                                                    })
                                                }
                                            />
                                        ) : (
                                            <SearchableSelect
                                                className="control font-num"
                                                value={
                                                    tokenCodes[line.key] || ""
                                                }
                                                onChange={(e) =>
                                                    setTokenCodes({
                                                        ...tokenCodes,
                                                        [line.key]:
                                                            e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">
                                                    {availableTokens.length
                                                        ? "Pilih token peminjam"
                                                        : "Tidak ada token tersedia"}
                                                </option>
                                                {availableTokens
                                                    .filter(
                                                        (x) =>
                                                            x.status ===
                                                                "dipegang_peminjam" &&
                                                            !Object.entries(
                                                                tokenCodes,
                                                            ).some(
                                                                ([key, code]) =>
                                                                    key !==
                                                                        line.key &&
                                                                    code ===
                                                                        x.code,
                                                            ),
                                                    )
                                                    .map((x) => (
                                                        <option
                                                            key={x.id}
                                                            value={x.code}
                                                        >
                                                            {x.code}
                                                        </option>
                                                    ))}
                                            </SearchableSelect>
                                        )}
                                    </Field>
                                </div>
                            ))}
                        </div>
                        {errors.token_codes && (
                            <p className="mt-3 text-sm text-red">
                                {errors.token_codes}
                            </p>
                        )}
                        <dl className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
                            {canChooseBorrower && (
                                <Summary
                                    label="Peminjam"
                                    value={
                                        newBorrower
                                            ? guest.name || "Belum diisi"
                                            : borrower?.name || "Belum dipilih"
                                    }
                                />
                            )}
                            <Summary
                                label="Area"
                                value={
                                    usage === "luar_area"
                                        ? "Luar Workshop"
                                        : "Dalam Workshop"
                                }
                            />
                            <Summary label="Lokasi" value={location} />
                            <Summary label="Mulai" value={start} />
                        </dl>
                    </Panel>
                    <div>
                        <Panel className="p-5">
                            <PackagePlus className="text-green" />
                            <p className="mt-3 text-sm text-muted">
                                Kepingan diterima petugas
                            </p>
                            <p className="font-num text-4xl font-semibold">
                                {
                                    Object.values(tokenCodes).filter(Boolean)
                                        .length
                                }
                                /{chosenLines.length}
                            </p>
                            <p className="mt-4 text-xs leading-relaxed text-muted">
                                Kode disimpan pada item dan tidak dapat dipakai
                                lagi sebelum transaksi selesai.
                            </p>
                        </Panel>
                        <button
                            disabled={
                                processing ||
                                Object.values(tokenCodes).filter(Boolean)
                                    .length !== chosenLines.length ||
                                (canChooseBorrower &&
                                    newBorrower &&
                                    !guest.name)
                            }
                            onClick={submit}
                            className="btn-primary mt-4 w-full"
                        >
                            {processing
                                ? "Menyimpan..."
                                : canChooseBorrower
                                  ? "Buat Peminjaman"
                                  : "Kirim Permohonan"}
                            <ArrowRight size={17} />
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="btn-secondary mt-2 w-full"
                        >
                            <ArrowLeft size={17} />
                            Ubah Detail
                        </button>
                    </div>
                </div>
            )}
        </TamsLayout>
    );
}

function TokenRule() {
    return (
        <Panel className="p-5">
            <KeyRound className="text-amber" />
            <p className="mt-3 font-display text-xl font-bold">
                Aturan token fisik
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
                Setiap alat memakai satu kepingan berbeda. Token dikembalikan
                setelah inspeksi barang selesai.
            </p>
        </Panel>
    );
}
function Usage({ active, onClick, icon: Icon, title, desc }: any) {
    return (
        <button
            onClick={onClick}
            className={`rounded-lg border p-5 text-left ${active ? "border-green bg-green/5 ring-2 ring-green/10" : "bg-white hover:border-ink"}`}
        >
            <Icon className={active ? "text-green" : "text-muted"} size={28} />
            <h3 className="mt-5 font-display text-2xl font-bold">{title}</h3>
            <p className="mt-2 text-sm text-muted">{desc}</p>
        </button>
    );
}
function Actions({
    back,
    next,
    disabled = false,
}: {
    back: () => void;
    next: () => void;
    disabled?: boolean;
}) {
    return (
        <div className="mt-6 flex justify-between border-t pt-5">
            <button onClick={back} className="btn-secondary">
                <ArrowLeft size={17} />
                Kembali
            </button>
            <button disabled={disabled} onClick={next} className="btn-primary">
                Lanjutkan
                <ArrowRight size={17} />
            </button>
        </div>
    );
}
function Field({
    label,
    error,
    wide = false,
    children,
}: {
    label: string;
    error?: string;
    wide?: boolean;
    children: any;
}) {
    return (
        <label className={wide ? "sm:col-span-2" : ""}>
            <span className="label">{label}</span>
            {children}
            {error && (
                <span className="mt-1 block text-xs text-red">{error}</span>
            )}
        </label>
    );
}
function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {label}
            </dt>
            <dd className="mt-1 text-sm font-semibold">{value}</dd>
        </div>
    );
}
