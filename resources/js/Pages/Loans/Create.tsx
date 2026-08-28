import { Head, router } from "@inertiajs/react";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    FileText,
    KeyRound,
    MapPin,
    PackagePlus,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import SearchableSelect from "@/Components/SearchableSelect";
import { AssetGlyph, PageHeader, Panel } from "@/Components/TamsUI";
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
};

export default function Create({
    tools,
    preselected,
    borrowers,
    canChooseBorrower,
    selectedBorrowerId,
    logisticsApprovers,
}: {
    tools: LoanTool[];
    preselected: number[];
    borrowers: Borrower[];
    canChooseBorrower: boolean;
    selectedBorrowerId: number;
    logisticsApprovers: { id: number; name: string }[];
}) {
    const [step, setStep] = useState(1),
        [selected, setSelected] = useState<number[]>(preselected);
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
        [tokenCodes, setTokenCodes] = useState<Record<number, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({}),
        [processing, setProcessing] = useState(false);
    const chosen = useMemo(
            () => tools.filter((t) => selected.includes(t.id)),
            [selected, tools],
        ),
        borrower = borrowers.find((b) => b.id === borrowerId);
    const availableTokens =
        borrower?.tokens.filter(
            (token) => token.status === "dipegang_peminjam",
        ) ?? [];
    const toggle = (id: number) => {
        if (selected.includes(id)) {
            setTokenCodes((codes) => {
                const next = { ...codes };
                delete next[id];
                return next;
            });
        }
        setSelected((items) =>
            items.includes(id)
                ? items.filter((item) => item !== id)
                : [...items, id],
        );
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
        selected.forEach((id) => {
            const tool = tools.find((item) => item.id === id);
            data.append("tool_type_ids[]", String(id));
            if (tool)
                data.append(
                    `tool_unit_ids[${id}]`,
                    String(tool.approval_unit_id),
                );
            data.append(`token_codes[${id}]`, tokenCodes[id] || "");
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
                                Satu jenis alat membutuhkan satu token fisik.
                            </p>
                        </div>
                        <div className="grid gap-3 p-4 sm:grid-cols-2">
                            {tools.map((tool) => {
                                const active = selected.includes(tool.id);
                                const hasOwner = Boolean(
                                    tool.approval_owner_sso_user_id,
                                );
                                return (
                                    <button
                                        type="button"
                                        key={tool.id}
                                        onClick={() => toggle(tool.id)}
                                        className={`overflow-hidden rounded-lg border text-left ${active ? "border-green ring-2 ring-green/15" : "bg-white hover:border-ink"}`}
                                    >
                                        <div className="grid grid-cols-[92px_1fr]">
                                            <AssetGlyph code={tool.code} />
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
                                                {!hasOwner && (
                                                    <p className="mt-1 text-xs font-semibold text-red">
                                                        Hanya dapat dipinjam di dalam workshop
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {active && (
                                            <div className="flex items-center gap-2 bg-green px-3 py-2 text-xs font-bold text-white">
                                                <Check size={14} />
                                                Dipilih · 1 token fisik
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
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
                            desc="Memerlukan periode, surat, approval owner, dan Kepala Logistik."
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
                                        Dua tahap sebelum alat diserahkan
                                    </h3>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2">
                                <div className="border-b border-line p-5 md:border-b-0 md:border-r">
                                    <p className="font-num text-[10px] font-bold uppercase tracking-wider text-green">
                                        Approval 01
                                    </p>
                                    <h4 className="mt-1 font-display text-xl font-bold">
                                        Owner Aset
                                    </h4>
                                    <div className="mt-3 space-y-2">
                                        {chosen.map((tool) => (
                                            <div
                                                key={tool.id}
                                                className="rounded border bg-surface px-3 py-2"
                                            >
                                                <p className="text-xs font-semibold">
                                                    {tool.approval_owner ||
                                                        "Owner belum ditetapkan"}
                                                </p>
                                                <p className="mt-0.5 font-num text-[10px] text-muted">
                                                    {tool.name} ·{" "}
                                                    {tool.approval_unit_code}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <p className="font-num text-[10px] font-bold uppercase tracking-wider text-amber-ink">
                                        Approval 02
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
                                        Tahap ini aktif setelah seluruh owner
                                        aset menyetujui.
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
                                    chosen.some(
                                        (tool) =>
                                            !tool.approval_owner_sso_user_id,
                                    )))
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
                            {chosen.map((t) => (
                                <div
                                    key={t.id}
                                    className="grid gap-3 rounded border bg-canvas/50 p-3 sm:grid-cols-[1fr_220px] sm:items-center"
                                >
                                    <div>
                                        <p className="font-display text-lg font-bold">
                                            {t.name}
                                        </p>
                                        <p className="font-num text-xs text-muted">
                                            {t.code}
                                        </p>
                                    </div>
                                    <Field
                                        label="Kode token fisik"
                                        error={errors[`token_codes.${t.id}`]}
                                    >
                                        {canChooseBorrower && newBorrower ? (
                                            <input
                                                className="control font-num uppercase"
                                                placeholder="Contoh: 08-01"
                                                value={tokenCodes[t.id] || ""}
                                                onChange={(e) =>
                                                    setTokenCodes({
                                                        ...tokenCodes,
                                                        [t.id]:
                                                            e.target.value.toUpperCase(),
                                                    })
                                                }
                                            />
                                        ) : (
                                            <SearchableSelect
                                                className="control font-num"
                                                value={tokenCodes[t.id] || ""}
                                                onChange={(e) =>
                                                    setTokenCodes({
                                                        ...tokenCodes,
                                                        [t.id]: e.target.value,
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
                                                                    Number(
                                                                        key,
                                                                    ) !==
                                                                        t.id &&
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
                                /{selected.length}
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
                                    .length !== selected.length ||
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
