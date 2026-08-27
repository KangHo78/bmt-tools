import { Head, router, useForm } from "@inertiajs/react";
import {
    ArrowRight,
    Boxes,
    Check,
    Download,
    FileSpreadsheet,
    KeyRound,
    ListChecks,
    MapPinned,
    Pencil,
    Plus,
    Settings,
    ShieldCheck,
    Tags,
    Trash2,
    Upload,
    Users,
    UserPlus,
} from "lucide-react";
import { useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import SearchableSelect from "@/Components/SearchableSelect";
import { PageHeader, Panel, StatusBadge } from "@/Components/TamsUI";
import LocationTree from "@/Components/LocationTree";
import { formatDateTime, roleLabels } from "@/lib/ui";

const RULES_PLACEHOLDER = `Contoh:
- Hanya digunakan di area workshop
- Wajib menggunakan APD
- Maksimal peminjaman 7 hari
- Bersihkan alat sebelum dikembalikan`;

export default function Admin(props: {
    users: any[];
    borrowers: any[];
    activity: any[];
    categories: any[];
    locations: any[];
    toolTypes: any[];
    checklistItems: any[];
    masterItems: any[];
    settings: any[];
    approvalCandidates: any[];
    approvalUserIds: number[];
}) {
    const [tab, setTab] = useState("users");
    const tabs = [
        ["users", "Pengguna", Users],
        ["borrowers", "Peminjam & Token", KeyRound],
        ["master", "Master Aset", Boxes],
        ["checklists", "Master Checklist", ListChecks],
        ["categories", "Kategori", Tags],
        ["locations", "Lokasi", MapPinned],
        ["approvers", "Approval", ShieldCheck],
        ["settings", "Pengaturan", Settings],
        ["activity", "Audit Trail", Settings],
    ];
    return (
        <TamsLayout>
            <Head title="Administrasi" />
            <PageHeader
                eyebrow="System control"
                title="Administrasi"
                description="Kelola akses, peminjam, token fisik, master data, parameter, dan audit trail."
            />
            <div className="mb-5 flex flex-wrap gap-2">
                {tabs.map(([key, label, Icon]: any) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`btn-secondary ${tab === key ? "!border-ink !bg-ink !text-white" : ""}`}
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
            </div>
            {tab === "users" && <UsersTab users={props.users} />}{" "}
            {tab === "borrowers" && (
                <BorrowersTab borrowers={props.borrowers} />
            )}{" "}
            {tab === "master" && <MasterTab {...props} />}{" "}
            {tab === "checklists" && (
                <ChecklistTab checklistItems={props.checklistItems} />
            )}{" "}
            {tab === "categories" && (
                <CategoriesTab categories={props.categories} />
            )}{" "}
            {tab === "locations" && (
                <LocationsTab locations={props.locations} />
            )}{" "}
            {tab === "approvers" && (
                <ApproversTab
                    candidates={props.approvalCandidates}
                    initialIds={props.approvalUserIds}
                />
            )}{" "}
            {tab === "settings" && <SettingsTab settings={props.settings} />}{" "}
            {tab === "activity" && <Activity rows={props.activity} />}
        </TamsLayout>
    );
}
function ApproversTab({
    candidates,
    initialIds,
}: {
    candidates: any[];
    initialIds: number[];
}) {
    const form = useForm({ user_ids: initialIds, reason: "" });
    const toggle = (id: number) => {
        form.setData(
            "user_ids",
            form.data.user_ids.includes(id)
                ? form.data.user_ids.filter((userId) => userId !== id)
                : [...form.data.user_ids, id],
        );
    };

    return (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <Panel className="overflow-hidden">
                <div className="border-b bg-ink p-6 text-white">
                    <div className="flex items-start gap-4">
                        <div className="grid size-11 shrink-0 place-items-center rounded-md border border-amber/50 bg-amber text-ink">
                            <ShieldCheck size={23} />
                        </div>
                        <div>
                            <p className="font-num text-[10px] font-bold uppercase tracking-[.18em] text-amber">
                                Decision authority
                            </p>
                            <h2 className="mt-1 font-display text-3xl font-bold">
                                Penanggung Jawab Approval
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
                                Pilih akun yang berhak melihat antrean serta
                                menyetujui atau menolak pinjaman dan
                                perpanjangan luar area.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="divide-y">
                    {candidates.map((user) => {
                        const selected = form.data.user_ids.includes(user.id);
                        return (
                            <button
                                type="button"
                                key={user.id}
                                onClick={() => toggle(user.id)}
                                className={`grid w-full gap-3 p-5 text-left transition-colors sm:grid-cols-[auto_1fr_auto] sm:items-center ${selected ? "bg-green/10" : "hover:bg-canvas"}`}
                            >
                                <span
                                    className={`grid size-6 place-items-center rounded border-2 ${selected ? "border-green bg-green text-white" : "border-line bg-surface"}`}
                                >
                                    {selected && <ShieldCheck size={14} />}
                                </span>
                                <span>
                                    <strong className="block">
                                        {user.name}
                                    </strong>
                                    <small className="mt-1 block text-muted">
                                        {user.email} ·{" "}
                                        {user.institution || "Tanpa unit kerja"}
                                    </small>
                                </span>
                                <StatusBadge status={user.role} />
                            </button>
                        );
                    })}
                    {!candidates.length && (
                        <p className="p-8 text-center text-sm text-muted">
                            Belum ada Kepala Logistik atau Administrator aktif.
                        </p>
                    )}
                </div>
            </Panel>
            <Panel className="h-fit border-t-4 !border-t-amber p-5">
                <p className="font-num text-xs font-bold text-muted">
                    {form.data.user_ids.length} APPROVER DIPILIH
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold">
                    Simpan Kewenangan
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    Minimal satu approver wajib aktif agar permohonan tidak
                    tertahan tanpa pengambil keputusan.
                </p>
                <div className="mt-5">
                    <Input
                        label="Alasan perubahan (catatan audit)"
                        value={form.data.reason}
                        set={(value) => form.setData("reason", value)}
                    />
                    {form.errors.user_ids && (
                        <p className="mt-2 text-xs font-semibold text-red">
                            {form.errors.user_ids}
                        </p>
                    )}
                    {form.errors.reason && (
                        <p className="mt-2 text-xs font-semibold text-red">
                            {form.errors.reason}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    disabled={form.processing || form.data.user_ids.length < 1}
                    onClick={() => form.post("/administrasi/approver")}
                    className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ShieldCheck size={17} />
                    {form.processing ? "Menyimpan..." : "Simpan Approver"}
                </button>
            </Panel>
        </div>
    );
}
function BorrowersTab({ borrowers }: { borrowers: any[] }) {
    const [selectedId, setSelectedId] = useState<number | null>(
        borrowers[0]?.id ?? null,
    );
    const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
    const [code, setCode] = useState("");
    const [transfer, setTransfer] = useState({ borrower_id: "", reason: "" });
    const [guest, setGuest] = useState({
        name: "",
        identifier: "",
        institution: "",
        phone: "",
    });
    const selected =
        borrowers.find((borrower) => borrower.id === selectedId) ??
        borrowers[0];
    const selectedToken = borrowers
        .flatMap((borrower) =>
            borrower.tokens.map((token: any) => ({
                ...token,
                owner: borrower,
            })),
        )
        .find((token) => token.id === selectedTokenId);
    return (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <Panel className="overflow-hidden">
                <div className="border-b p-5">
                    <h2 className="font-display text-2xl font-bold">
                        Peminjam & Kepingan Token
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Profil dapat terhubung ke akun SSO atau berdiri sendiri
                        untuk peminjam yang datang langsung.
                    </p>
                </div>
                <div className="divide-y">
                    {borrowers.map((b) => (
                        <button
                            key={b.id}
                            onClick={() => setSelectedId(b.id)}
                            className={`grid w-full gap-3 p-4 text-left sm:grid-cols-[1fr_auto] ${selected?.id === b.id ? "bg-amber/10" : "hover:bg-canvas"}`}
                        >
                            <div>
                                <strong>{b.name}</strong>
                                <small>
                                    {b.institution ||
                                        b.identifier ||
                                        "Identitas belum dicatat"}{" "}
                                    · {b.user ? "Terhubung SSO" : "Tanpa akun"}
                                </small>
                            </div>
                            <div className="flex flex-wrap justify-end gap-1">
                                {b.tokens.length ? (
                                    b.tokens.map((t: any) => (
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setSelectedId(b.id);
                                                setSelectedTokenId(t.id);
                                                setTransfer({
                                                    borrower_id: "",
                                                    reason: "",
                                                });
                                            }}
                                            key={t.id}
                                            className={`rounded border px-2 py-1 font-num text-[10px] font-bold ${selectedTokenId === t.id ? "border-ink bg-ink text-white" : t.status === "dipegang_peminjam" ? "border-green/20 bg-green/10 text-green" : "border-amber/30 bg-amber/15 text-ink"}`}
                                        >
                                            {t.code} ·{" "}
                                            {t.status.replaceAll("_", " ")}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted">
                                        Belum ada token
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </Panel>
            <div className="space-y-5">
                {selectedToken && (
                    <Panel className="overflow-hidden border-l-4 !border-l-amber">
                        <div className="bg-ink p-5 text-white">
                            <p className="font-num text-xs text-amber">
                                PINDAH KEPEMILIKAN
                            </p>
                            <h3 className="mt-1 font-display text-3xl font-bold">
                                {selectedToken.code}
                            </h3>
                            <p className="mt-1 text-xs text-white/60">
                                Pemilik sekarang: {selectedToken.owner.name}
                            </p>
                        </div>
                        <div className="space-y-3 p-5">
                            {selectedToken.status === "dipegang_peminjam" ? (
                                <>
                                    <label>
                                        <span className="label">
                                            Pemilik baru
                                        </span>
                                        <SearchableSelect
                                            className="control"
                                            value={transfer.borrower_id}
                                            onChange={(event) =>
                                                setTransfer({
                                                    ...transfer,
                                                    borrower_id:
                                                        event.target.value,
                                                })
                                            }
                                        >
                                            <option value="">
                                                Pilih peminjam
                                            </option>
                                            {borrowers
                                                .filter(
                                                    (borrower) =>
                                                        borrower.id !==
                                                            selectedToken.owner
                                                                .id &&
                                                        borrower.is_active !==
                                                            false,
                                                )
                                                .map((borrower) => (
                                                    <option
                                                        key={borrower.id}
                                                        value={borrower.id}
                                                    >
                                                        {borrower.name} ·{" "}
                                                        {borrower.institution ||
                                                            borrower.identifier ||
                                                            "Tanpa unit"}
                                                    </option>
                                                ))}
                                        </SearchableSelect>
                                    </label>
                                    <Input
                                        label="Alasan pemindahan"
                                        value={transfer.reason}
                                        set={(value) =>
                                            setTransfer({
                                                ...transfer,
                                                reason: value,
                                            })
                                        }
                                    />
                                    <button
                                        disabled={
                                            !transfer.borrower_id ||
                                            transfer.reason.length < 3
                                        }
                                        onClick={() =>
                                            router.post(
                                                `/administrasi/token/${selectedToken.id}/pindah`,
                                                transfer,
                                                {
                                                    onSuccess: () => {
                                                        setSelectedTokenId(
                                                            null,
                                                        );
                                                        setTransfer({
                                                            borrower_id: "",
                                                            reason: "",
                                                        });
                                                    },
                                                },
                                            )
                                        }
                                        className="btn-primary mt-2 w-full"
                                    >
                                        Pindahkan Token
                                        <ArrowRight size={16} />
                                    </button>
                                </>
                            ) : (
                                <p className="rounded border border-amber/30 bg-amber/10 p-3 text-sm">
                                    Token sedang digunakan. Selesaikan atau
                                    batalkan transaksi terlebih dahulu sebelum
                                    memindahkan kepemilikan.
                                </p>
                            )}
                        </div>
                    </Panel>
                )}
                <Panel className="p-5">
                    <div className="flex items-center gap-2">
                        <KeyRound size={19} />
                        <h3 className="font-display text-xl font-bold">
                            Daftarkan Kepingan
                        </h3>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                        Token untuk{" "}
                        <strong>{selected?.name || "pilih peminjam"}</strong>.
                    </p>
                    <div className="mt-4">
                        <Input
                            label="Satu kode atau rentang"
                            value={code}
                            set={(value) => setCode(value.toUpperCase())}
                        />
                    </div>
                    <p className="mt-2 rounded border border-dashed border-line bg-canvas p-2 font-num text-[11px] text-muted">
                        <strong>08-01-10</strong> → membuat 08-01 sampai 08-10
                    </p>
                    <button
                        disabled={!selected || !code}
                        onClick={() =>
                            router.post(
                                `/administrasi/peminjam/${selected.id}/token`,
                                { code },
                                { onSuccess: () => setCode("") },
                            )
                        }
                        className="btn-primary mt-4 w-full"
                    >
                        <Plus size={16} />
                        Tambah Token
                    </button>
                </Panel>
                <Panel className="p-5">
                    <div className="flex items-center gap-2">
                        <UserPlus size={19} />
                        <h3 className="font-display text-xl font-bold">
                            Peminjam Tanpa Akun
                        </h3>
                    </div>
                    <div className="mt-4 space-y-3">
                        <Input
                            label="Nama lengkap"
                            value={guest.name}
                            set={(v) => setGuest({ ...guest, name: v })}
                        />
                        <Input
                            label="NIK / NRP / identitas"
                            value={guest.identifier}
                            set={(v) => setGuest({ ...guest, identifier: v })}
                        />
                        <Input
                            label="Unit / perusahaan"
                            value={guest.institution}
                            set={(v) => setGuest({ ...guest, institution: v })}
                        />
                        <Input
                            label="Nomor telepon"
                            value={guest.phone}
                            set={(v) => setGuest({ ...guest, phone: v })}
                        />
                    </div>
                    <button
                        disabled={!guest.name}
                        onClick={() =>
                            router.post("/administrasi/peminjam", guest, {
                                onSuccess: () =>
                                    setGuest({
                                        name: "",
                                        identifier: "",
                                        institution: "",
                                        phone: "",
                                    }),
                            })
                        }
                        className="btn-primary mt-4 w-full"
                    >
                        <UserPlus size={16} />
                        Tambah Peminjam
                    </button>
                </Panel>
            </div>
        </div>
    );
}
function UsersTab({ users }: { users: any[] }) {
    const [edit, setEdit] = useState<any>(null);
    return (
        <Panel className="overflow-hidden">
            <div className="border-b p-5">
                <h2 className="font-display text-2xl font-bold">
                    Akun & Hak Akses
                </h2>
                <p className="mt-1 text-sm text-muted">
                    Pengguna dan hak akses disinkronkan dari grup Tools
                    Management pada aplikasi utama.
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-ink text-[10px] uppercase tracking-wider text-white">
                        <tr>
                            <th className="p-3">Pengguna</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Lembaga</th>
                            <th className="p-3">Status</th>
                            <th className="p-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} className="border-b last:border-0">
                                <td className="p-3">
                                    <strong>{u.name}</strong>
                                    <small>{u.email}</small>
                                </td>
                                <td className="p-3">{roleLabels[u.role]}</td>
                                <td className="p-3">{u.institution}</td>
                                <td className="p-3">
                                    <StatusBadge
                                        status={
                                            u.is_active ? "tersedia" : "ditolak"
                                        }
                                    />
                                </td>
                                <td className="p-3">
                                    <button
                                        onClick={() => setEdit(u)}
                                        className="btn-secondary !min-h-9"
                                    >
                                        Ubah
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {edit && <EditUser user={edit} close={() => setEdit(null)} />}
        </Panel>
    );
}
function EditUser({ user, close }: { user: any; close: () => void }) {
    const [d, setD] = useState({
        institution: user.institution ?? "",
        is_active: Boolean(user.is_active),
        reason: "",
    });
    return (
        <Modal title={`Akses ${user.name}`} close={close}>
            <div className="space-y-3">
                <p className="rounded-md border border-line bg-canvas p-3 text-sm">
                    Hak akses: <strong>{roleLabels[user.role]}</strong>. Ubah
                    melalui grup pengguna di aplikasi utama.
                </p>
                <Input
                    label="Lembaga"
                    value={d.institution}
                    set={(v) => setD({ ...d, institution: v })}
                />
                <label className="flex gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={d.is_active}
                        onChange={(e) =>
                            setD({ ...d, is_active: e.target.checked })
                        }
                    />
                    Akun aktif
                </label>
                <Input
                    label="Alasan perubahan"
                    value={d.reason}
                    set={(v) => setD({ ...d, reason: v })}
                />
            </div>
            <button
                onClick={() =>
                    router.post(`/administrasi/pengguna/${user.id}`, d, {
                        onSuccess: close,
                    })
                }
                className="btn-primary mt-5 w-full"
            >
                Simpan Akses
            </button>
        </Modal>
    );
}
function MasterTab({
    toolTypes,
    masterItems,
    categories,
    locations,
    checklistItems,
}: any) {
    const [edit, setEdit] = useState<any>(null);
    const [deleting, setDeleting] = useState<any>(null);
    const [importing, setImporting] = useState(false);
    const [d, setD] = useState({
        sso_item_id: "",
        category_id: "",
        primary_location_id: "",
        rules_summary: "",
        checklist_item_ids: [] as number[],
    });
    const selectedItem = masterItems.find(
        (item: any) => String(item.id) === String(d.sso_item_id),
    );
    return (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <Panel className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
                    <div>
                        <h2 className="font-display text-2xl font-bold">
                            Jenis Alat
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                            {toolTypes.length} master aset terdaftar
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setImporting(true)}
                        className="btn-secondary"
                    >
                        <FileSpreadsheet size={16} />
                        Import Excel
                    </button>
                </div>
                {toolTypes.map((t: any) => (
                    <div
                        key={t.id}
                        className="grid gap-3 border-b p-4 last:border-0 sm:grid-cols-[120px_1fr_160px_auto] sm:items-center"
                    >
                        <span className="font-num text-xs font-bold">
                            {t.code}
                        </span>
                        <div>
                            <strong>{t.name}</strong>
                            <small>{t.category?.name}</small>
                        </div>
                        <span className="text-xs text-muted">
                            {t.primary_location?.name}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEdit(t)}
                                className="btn-secondary !min-h-9 !px-3"
                                aria-label={`Ubah ${t.name}`}
                            >
                                <Pencil size={15} />
                                Ubah
                            </button>
                            <button
                                onClick={() => setDeleting(t)}
                                className="btn-secondary !min-h-9 !border-red/30 !px-3 !text-red"
                                aria-label={`Hapus ${t.name}`}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>
                ))}
            </Panel>
            <div className="space-y-5">
                <Panel className="p-5">
                    <h2 className="font-display text-2xl font-bold">
                        Jenis Baru
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Nama dan kode mengikuti Master Item Buana Multi.
                    </p>
                    <div className="mt-4 space-y-3">
                        <label>
                            <span className="label">Master item</span>
                            <SearchableSelect
                                value={d.sso_item_id}
                                onChange={(event) =>
                                    setD({
                                        ...d,
                                        sso_item_id: event.target.value,
                                    })
                                }
                            >
                                <option value="">Pilih item Tool...</option>
                                {masterItems.map((item: any) => (
                                    <option
                                        key={item.id}
                                        value={item.id}
                                        disabled={toolTypes.some(
                                            (tool: any) =>
                                                tool.sso_item_id === item.id ||
                                                tool.code === item.item_no,
                                        )}
                                    >
                                        {item.item_no} · {item.item_name} ·{" "}
                                        {item.manufacture_pn || "Tanpa PN"}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </label>
                        {selectedItem && (
                            <MasterItemPreview item={selectedItem} />
                        )}
                        <SelectMap
                            label="Kategori"
                            value={d.category_id}
                            set={(v) => setD({ ...d, category_id: v })}
                            rows={categories}
                        />
                        <SelectMap
                            label="Lokasi utama"
                            value={d.primary_location_id}
                            set={(v) => setD({ ...d, primary_location_id: v })}
                            rows={locations}
                        />
                        <Textarea
                            label="Aturan peminjaman"
                            value={d.rules_summary}
                            set={(v) => setD({ ...d, rules_summary: v })}
                            placeholder={RULES_PLACEHOLDER}
                            hint="Tuliskan batas penggunaan, kewajiban APD, durasi, dan ketentuan pengembalian."
                        />
                        <ChecklistPicker
                            items={checklistItems}
                            selected={d.checklist_item_ids}
                            onChange={(ids) =>
                                setD({ ...d, checklist_item_ids: ids })
                            }
                        />
                        <button
                            disabled={
                                !d.sso_item_id ||
                                !d.category_id ||
                                !d.primary_location_id ||
                                !d.checklist_item_ids.length
                            }
                            onClick={() =>
                                router.post("/administrasi/jenis-alat", d)
                            }
                            className="btn-primary w-full"
                        >
                            Tambah Jenis
                        </button>
                    </div>
                </Panel>
            </div>
            {edit && (
                <EditToolType
                    tool={edit}
                    masterItems={masterItems}
                    categories={categories}
                    locations={locations}
                    checklistItems={checklistItems}
                    close={() => setEdit(null)}
                />
            )}
            {importing && (
                <ImportMasterAssets close={() => setImporting(false)} />
            )}
            {deleting && (
                <ConfirmDelete
                    title="Hapus master aset?"
                    description={`${deleting.code} — ${deleting.name} akan dihapus. Master yang sudah memiliki unit atau transaksi akan tetap dilindungi.`}
                    close={() => setDeleting(null)}
                    confirm={() =>
                        router.delete(
                            `/administrasi/jenis-alat/${deleting.id}`,
                            { onSuccess: () => setDeleting(null) },
                        )
                    }
                />
            )}
        </div>
    );
}

function ImportMasterAssets({ close }: { close: () => void }) {
    const form = useForm<{ import_file: File | null }>({
        import_file: null,
    });
    const error = form.errors.import_file;

    return (
        <Modal title="Import Master Aset" close={close}>
            <div className="overflow-hidden rounded-md border border-line bg-canvas">
                <div className="grid gap-4 border-b border-line bg-ink p-5 text-white sm:grid-cols-[auto_1fr] sm:items-center">
                    <span className="grid size-12 place-items-center rounded-md border border-amber/50 bg-amber text-ink">
                        <FileSpreadsheet size={25} />
                    </span>
                    <div>
                        <p className="font-num text-[10px] font-bold uppercase tracking-[.18em] text-amber">
                            Bulk data entry
                        </p>
                        <h3 className="mt-1 font-display text-2xl font-bold">
                            Isi template, lalu unggah kembali
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-white/65">
                            Item baru ditambahkan dan item yang sudah ada
                            diperbarui berdasarkan ITEM NO.
                        </p>
                    </div>
                </div>

                <div className="space-y-4 p-5">
                    <a
                        href="/administrasi/jenis-alat/template-import"
                        className="btn-secondary w-full justify-center !border-green/30 !bg-green/10 !text-green"
                    >
                        <Download size={16} />
                        Unduh Template Excel
                    </a>

                    <label
                        className={`group flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-5 py-8 text-center transition-colors ${
                            form.data.import_file
                                ? "border-green bg-green/10"
                                : "border-line bg-surface hover:border-amber hover:bg-amber/5"
                        }`}
                    >
                        <input
                            type="file"
                            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                            className="sr-only"
                            onChange={(event) => {
                                form.clearErrors("import_file");
                                form.setData(
                                    "import_file",
                                    event.target.files?.[0] ?? null,
                                );
                            }}
                        />
                        <span className="grid size-10 place-items-center rounded-full bg-ink text-white transition-transform group-hover:-translate-y-0.5">
                            <Upload size={18} />
                        </span>
                        <strong className="mt-3 block text-sm">
                            {form.data.import_file
                                ? form.data.import_file.name
                                : "Pilih file Excel"}
                        </strong>
                        <small className="mt-1 text-muted">
                            XLSX atau XLS, maksimal 5 MB dan 1.000 baris
                        </small>
                    </label>

                    {error && (
                        <div
                            role="alert"
                            className="whitespace-pre-line rounded-md border border-red/25 bg-red/10 p-3 text-sm leading-relaxed text-red"
                        >
                            {error}
                        </div>
                    )}

                    <div className="rounded-md border border-line bg-surface p-4 text-xs leading-relaxed text-muted">
                        <strong className="mb-1 block text-ink">
                            Sebelum mengimpor
                        </strong>
                        Kategori dan lokasi harus sudah tersedia. Pisahkan
                        beberapa poin checklist dengan tanda |. Seluruh file
                        dibatalkan jika ada satu baris yang tidak valid.
                    </div>
                </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={close} className="btn-secondary">
                    Batal
                </button>
                <button
                    type="button"
                    disabled={!form.data.import_file || form.processing}
                    onClick={() =>
                        form.post("/administrasi/jenis-alat/import", {
                            forceFormData: true,
                            preserveScroll: true,
                            onSuccess: () => {
                                form.reset();
                                close();
                            },
                        })
                    }
                    className="btn-primary"
                >
                    <Upload size={16} />
                    {form.processing ? "Mengimpor..." : "Import Sekarang"}
                </button>
            </div>
        </Modal>
    );
}
function EditToolType({
    tool,
    masterItems,
    categories,
    locations,
    checklistItems,
    close,
}: any) {
    const matchedSource = masterItems.find(
        (item: any) =>
            item.id === tool.sso_item_id || item.item_no === tool.code,
    );
    const [d, setD] = useState({
        sso_item_id: String(matchedSource?.id ?? ""),
        category_id: String(tool.category_id ?? ""),
        primary_location_id: String(tool.primary_location_id ?? ""),
        rules_summary: tool.rules_summary ?? "",
        checklist_item_ids: (
            tool.checklist_items ??
            checklistItems.filter((item: any) =>
                (tool.checklist ?? []).includes(item.name),
            )
        ).map((item: any) => item.id) as number[],
    });
    const selectedItem = masterItems.find(
        (item: any) => String(item.id) === String(d.sso_item_id),
    );
    return (
        <Modal title={`Ubah ${tool.name}`} close={close}>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                    <span className="label">Master item</span>
                    <SearchableSelect
                        value={d.sso_item_id}
                        onChange={(event) =>
                            setD({ ...d, sso_item_id: event.target.value })
                        }
                    >
                        <option value="">Pilih item Tool...</option>
                        {masterItems.map((item: any) => (
                            <option key={item.id} value={item.id}>
                                {item.item_no} · {item.item_name} ·{" "}
                                {item.manufacture_pn || "Tanpa PN"}
                            </option>
                        ))}
                    </SearchableSelect>
                </label>
                {selectedItem && (
                    <div className="sm:col-span-2">
                        <MasterItemPreview item={selectedItem} />
                    </div>
                )}
                <SelectMap
                    label="Kategori"
                    value={d.category_id}
                    set={(v) => setD({ ...d, category_id: v })}
                    rows={categories}
                />
                <SelectMap
                    label="Lokasi utama"
                    value={d.primary_location_id}
                    set={(v) => setD({ ...d, primary_location_id: v })}
                    rows={locations}
                />
                <Textarea
                    label="Aturan peminjaman"
                    value={d.rules_summary}
                    set={(v) => setD({ ...d, rules_summary: v })}
                    placeholder={RULES_PLACEHOLDER}
                    hint="Tuliskan batas penggunaan, kewajiban APD, durasi, dan ketentuan pengembalian."
                />
                <div className="sm:col-span-2">
                    <ChecklistPicker
                        items={checklistItems}
                        selected={d.checklist_item_ids}
                        onChange={(ids) =>
                            setD({ ...d, checklist_item_ids: ids })
                        }
                    />
                </div>
            </div>
            <button
                onClick={() =>
                    router.put(`/administrasi/jenis-alat/${tool.id}`, d, {
                        onSuccess: close,
                    })
                }
                className="btn-primary mt-5 w-full"
            >
                Simpan Perubahan
            </button>
        </Modal>
    );
}

function ChecklistPicker({
    items,
    selected,
    onChange,
}: {
    items: any[];
    selected: number[];
    onChange: (ids: number[]) => void;
}) {
    const toggle = (id: number) =>
        onChange(
            selected.includes(id)
                ? selected.filter((selectedId) => selectedId !== id)
                : [...selected, id],
        );

    return (
        <fieldset>
            <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                    <legend className="label">Checklist pemeriksaan</legend>
                    <p className="mt-1 text-xs text-muted">
                        Pilih poin yang wajib diperiksa untuk jenis aset ini.
                    </p>
                </div>
                <span className="shrink-0 rounded bg-ink px-2 py-1 font-num text-[10px] font-bold text-white">
                    {selected.length} DIPILIH
                </span>
            </div>
            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-md border border-line bg-canvas p-2">
                {items.map((item) => {
                    const checked = selected.includes(item.id);
                    return (
                        <label
                            key={item.id}
                            className={`flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors ${
                                checked
                                    ? "border-green/40 bg-green/10"
                                    : "border-transparent bg-surface hover:border-line"
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(item.id)}
                                className="sr-only"
                            />
                            <span
                                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border ${
                                    checked
                                        ? "border-green bg-green text-white"
                                        : "border-line bg-white"
                                }`}
                                aria-hidden="true"
                            >
                                {checked && <Check size={13} strokeWidth={3} />}
                            </span>
                            <span className="text-sm font-semibold leading-snug">
                                {item.name}
                            </span>
                        </label>
                    );
                })}
                {!items.length && (
                    <div className="p-5 text-center text-sm text-muted">
                        Belum ada master checklist. Tambahkan melalui tab Master
                        Checklist.
                    </div>
                )}
            </div>
            {items.length > 0 && selected.length === 0 && (
                <p className="mt-2 text-xs font-semibold text-red">
                    Pilih minimal satu poin checklist.
                </p>
            )}
        </fieldset>
    );
}

function ChecklistTab({ checklistItems }: { checklistItems: any[] }) {
    const [name, setName] = useState("");
    const [edit, setEdit] = useState<any>(null);
    const [deleting, setDeleting] = useState<any>(null);

    return (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <Panel className="overflow-hidden">
                <div className="border-b bg-ink p-6 text-white">
                    <p className="font-num text-[10px] font-bold uppercase tracking-[.18em] text-amber">
                        Inspection standards
                    </p>
                    <h2 className="mt-1 font-display text-3xl font-bold">
                        Master Checklist
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-white/65">
                        Kelola satu pustaka pemeriksaan yang dapat dipakai ulang
                        oleh berbagai jenis aset.
                    </p>
                </div>
                {checklistItems.map((item, index) => (
                    <div
                        key={item.id}
                        className="grid gap-3 border-b p-4 last:border-0 sm:grid-cols-[44px_1fr_auto] sm:items-center"
                    >
                        <span className="grid size-9 place-items-center rounded bg-canvas font-num text-xs font-bold text-muted">
                            {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                            <strong className="block">{item.name}</strong>
                            <small className="mt-1 block text-muted">
                                Dipakai oleh {item.tool_types_count} master aset
                            </small>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEdit(item)}
                                className="btn-secondary !min-h-9 !px-3"
                            >
                                <Pencil size={15} />
                                Ubah
                            </button>
                            <button
                                onClick={() => setDeleting(item)}
                                disabled={item.tool_types_count > 0}
                                title={
                                    item.tool_types_count > 0
                                        ? "Lepaskan dari semua master aset sebelum menghapus"
                                        : "Hapus poin checklist"
                                }
                                className="btn-secondary !min-h-9 !border-red/30 !px-3 !text-red disabled:cursor-not-allowed disabled:opacity-35"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>
                ))}
                {!checklistItems.length && (
                    <div className="p-10 text-center text-sm text-muted">
                        Belum ada poin checklist.
                    </div>
                )}
            </Panel>
            <Panel className="h-fit border-t-4 !border-t-amber p-5">
                <p className="label">Poin pemeriksaan baru</p>
                <h2 className="font-display text-2xl font-bold">
                    Tambah Checklist
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    Tulis satu pemeriksaan yang jelas dan dapat dijawab ya atau
                    tidak.
                </p>
                <div className="mt-4 space-y-3">
                    <Input
                        label="Poin checklist"
                        value={name}
                        set={setName}
                        placeholder="Contoh: Kabel daya tidak terkelupas"
                    />
                    <button
                        disabled={!name.trim()}
                        onClick={() =>
                            router.post(
                                "/administrasi/checklist",
                                { name },
                                { onSuccess: () => setName("") },
                            )
                        }
                        className="btn-primary w-full"
                    >
                        <Plus size={17} />
                        Tambah Poin
                    </button>
                </div>
            </Panel>
            {edit && (
                <EditChecklistItem item={edit} close={() => setEdit(null)} />
            )}
            {deleting && (
                <ConfirmDelete
                    title="Hapus poin checklist?"
                    description={`${deleting.name} akan dihapus dari master checklist.`}
                    close={() => setDeleting(null)}
                    confirm={() =>
                        router.delete(
                            `/administrasi/checklist/${deleting.id}`,
                            { onSuccess: () => setDeleting(null) },
                        )
                    }
                />
            )}
        </div>
    );
}

function EditChecklistItem({ item, close }: any) {
    const [name, setName] = useState(item.name);
    return (
        <Modal title="Ubah Poin Checklist" close={close}>
            <Input label="Poin checklist" value={name} set={setName} />
            <button
                disabled={!name.trim()}
                onClick={() =>
                    router.put(
                        `/administrasi/checklist/${item.id}`,
                        { name },
                        { onSuccess: close },
                    )
                }
                className="btn-primary mt-5 w-full"
            >
                Simpan Perubahan
            </button>
        </Modal>
    );
}

function MasterItemPreview({ item }: { item: any }) {
    return (
        <div className="rounded-md border border-green/20 bg-green/5 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-num text-xs font-bold text-green">
                        {item.item_no}
                    </p>
                    <p className="font-display text-xl font-bold">
                        {item.item_name}
                    </p>
                </div>
                <span className="rounded bg-ink px-2 py-1 font-num text-[10px] text-white">
                    {item.unit || "-"}
                </span>
            </div>
            <dl className="mt-3 grid gap-2 border-t border-green/15 pt-3 text-xs sm:grid-cols-2">
                <div>
                    <dt className="text-muted">Manufacture PN</dt>
                    <dd className="font-semibold">
                        {item.manufacture_pn || "-"}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted">Original Manufacture</dt>
                    <dd className="font-semibold">
                        {item.original_manufacture || "-"}
                    </dd>
                </div>
                <div className="sm:col-span-2">
                    <dt className="text-muted">Article / ukuran</dt>
                    <dd className="font-semibold">{item.article_no || "-"}</dd>
                </div>
            </dl>
        </div>
    );
}
function CategoriesTab({ categories }: { categories: any[] }) {
    const [d, setD] = useState({ name: "", function: "" });
    const [edit, setEdit] = useState<any>(null);
    const [deleting, setDeleting] = useState<any>(null);
    return (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <Panel className="overflow-hidden">
                <div className="border-b p-5">
                    <h2 className="font-display text-2xl font-bold">
                        Kategori Aset
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Kelompokkan master aset berdasarkan fungsi penggunaan.
                    </p>
                </div>
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="grid gap-3 border-b p-4 last:border-0 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
                    >
                        <strong>{category.name}</strong>
                        <span className="text-sm text-muted">
                            {category.function || "Belum ada keterangan fungsi"}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEdit(category)}
                                className="btn-secondary !min-h-9 !px-3"
                            >
                                <Pencil size={15} />
                                Ubah
                            </button>
                            <button
                                onClick={() => setDeleting(category)}
                                className="btn-secondary !min-h-9 !border-red/30 !px-3 !text-red"
                                aria-label={`Hapus ${category.name}`}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>
                ))}
            </Panel>
            <Panel className="h-fit p-5">
                <h2 className="font-display text-2xl font-bold">
                    Kategori Baru
                </h2>
                <div className="mt-4 space-y-3">
                    <Input
                        label="Nama"
                        value={d.name}
                        set={(v) => setD({ ...d, name: v })}
                    />
                    <Input
                        label="Fungsi"
                        value={d.function}
                        set={(v) => setD({ ...d, function: v })}
                    />
                    <button
                        onClick={() =>
                            router.post("/administrasi/kategori", d, {
                                onSuccess: () =>
                                    setD({ name: "", function: "" }),
                            })
                        }
                        className="btn-primary w-full"
                    >
                        Tambah Kategori
                    </button>
                </div>
            </Panel>
            {edit && (
                <EditCategory category={edit} close={() => setEdit(null)} />
            )}
            {deleting && (
                <ConfirmDelete
                    title="Hapus kategori?"
                    description={`${deleting.name} akan dihapus. Kategori yang masih digunakan master aset akan tetap dilindungi.`}
                    close={() => setDeleting(null)}
                    confirm={() =>
                        router.delete(`/administrasi/kategori/${deleting.id}`, {
                            onSuccess: () => setDeleting(null),
                        })
                    }
                />
            )}
        </div>
    );
}
function EditCategory({ category, close }: any) {
    const [d, setD] = useState({
        name: category.name ?? "",
        function: category.function ?? "",
    });
    return (
        <Modal title={`Ubah ${category.name}`} close={close}>
            <div className="space-y-3">
                <Input
                    label="Nama"
                    value={d.name}
                    set={(v) => setD({ ...d, name: v })}
                />
                <Input
                    label="Fungsi"
                    value={d.function}
                    set={(v) => setD({ ...d, function: v })}
                />
            </div>
            <button
                onClick={() =>
                    router.put(`/administrasi/kategori/${category.id}`, d, {
                        onSuccess: close,
                    })
                }
                className="btn-primary mt-5 w-full"
            >
                Simpan Perubahan
            </button>
        </Modal>
    );
}
function LocationsTab({ locations }: { locations: any[] }) {
    const [d, setD] = useState({
        name: "",
        type: "slot",
        parent_id: "",
        capacity: "",
    });
    return (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <Panel className="overflow-hidden">
                <div className="border-b p-5">
                    <h2 className="font-display text-2xl font-bold">
                        Struktur Lokasi
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Area induk ditampilkan bersama seluruh ruang, rak, dan
                        slot di bawahnya.
                    </p>
                </div>
                <LocationTree locations={locations} />
            </Panel>
            <Panel className="h-fit p-5">
                <h2 className="font-display text-2xl font-bold">Lokasi Baru</h2>
                <div className="mt-4 space-y-3">
                    <Input
                        label="Nama"
                        value={d.name}
                        set={(v) => setD({ ...d, name: v })}
                    />
                    <Select
                        label="Tipe"
                        value={d.type}
                        set={(v) => setD({ ...d, type: v })}
                        options={["area", "ruang", "rak", "slot"]}
                    />
                    <SelectMap
                        label="Induk"
                        value={d.parent_id}
                        set={(v) => setD({ ...d, parent_id: v })}
                        rows={locations}
                        optional
                    />
                    <Input
                        label="Kapasitas"
                        value={d.capacity}
                        set={(v) => setD({ ...d, capacity: v })}
                        type="number"
                    />
                    <button
                        onClick={() => router.post("/administrasi/lokasi", d)}
                        className="btn-primary w-full"
                    >
                        Tambah Lokasi
                    </button>
                </div>
            </Panel>
        </div>
    );
}
function SettingsTab({ settings }: { settings: any[] }) {
    const initial = Object.fromEntries(
        settings.map((x) => [x.key, x.value ?? ""]),
    );
    const [d, setD] = useState<Record<string, string>>(initial);
    const [reason, setReason] = useState("");
    return (
        <Panel className="mx-auto max-w-2xl p-5">
            <h2 className="font-display text-2xl font-bold">
                Parameter Operasional
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
                Parameter ini mengatur batas dan perilaku proses aplikasi.
                Alasan perubahan disimpan di Audit Trail agar perubahan
                konfigurasi dapat ditelusuri; isinya tidak mengubah perhitungan
                sistem.
            </p>
            <div className="mt-5 space-y-4">
                {Object.keys(d).map((key) => (
                    <Input
                        key={key}
                        label={key.replaceAll("_", " ")}
                        value={d[key]}
                        set={(v) => setD({ ...d, [key]: v })}
                    />
                ))}
                <Input
                    label="Alasan perubahan (catatan audit)"
                    value={reason}
                    set={setReason}
                />
                <button
                    onClick={() =>
                        router.post("/administrasi/pengaturan", {
                            settings: d,
                            reason,
                        })
                    }
                    className="btn-primary w-full"
                >
                    Simpan Pengaturan
                </button>
            </div>
        </Panel>
    );
}
function Activity({ rows }: { rows: any[] }) {
    return (
        <Panel className="overflow-hidden">
            {rows.map((x) => (
                <div key={x.id} className="border-b p-4 last:border-0">
                    <p className="text-sm font-semibold">{x.action}</p>
                    <p className="mt-1 text-xs text-muted">
                        {x.user?.name ?? "Sistem"} ·{" "}
                        {formatDateTime(x.created_at)}
                    </p>
                </div>
            ))}
        </Panel>
    );
}
function Modal({
    title,
    close,
    children,
}: {
    title: string;
    close: () => void;
    children: any;
}) {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/60 p-4">
            <Panel className="w-full max-w-2xl p-5">
                <div className="mb-5 flex justify-between">
                    <h2 className="font-display text-3xl font-bold">{title}</h2>
                    <button onClick={close}>×</button>
                </div>
                {children}
            </Panel>
        </div>
    );
}
function ConfirmDelete({
    title,
    description,
    close,
    confirm,
}: {
    title: string;
    description: string;
    close: () => void;
    confirm: () => void;
}) {
    return (
        <Modal title={title} close={close}>
            <div className="border-l-4 border-red bg-red/5 p-4">
                <p className="text-sm leading-relaxed text-ink">
                    {description}
                </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={close} className="btn-secondary">
                    Batal
                </button>
                <button
                    onClick={confirm}
                    className="btn-primary !border-red !bg-red !text-white"
                >
                    <Trash2 size={16} />
                    Hapus
                </button>
            </div>
        </Modal>
    );
}
function Textarea({
    label,
    value,
    set,
    placeholder,
    hint,
}: {
    label: string;
    value: string;
    set: (v: string) => void;
    placeholder?: string;
    hint?: string;
}) {
    return (
        <label>
            <span className="label">{label}</span>
            <textarea
                className="control min-h-24 resize-y"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
            />
            {hint && (
                <small className="mt-1.5 text-xs text-muted">{hint}</small>
            )}
        </label>
    );
}
function Input({
    label,
    value,
    set,
    type = "text",
    placeholder,
}: {
    label: string;
    value: any;
    set: (v: string) => void;
    type?: string;
    placeholder?: string;
}) {
    return (
        <label>
            <span className="label">{label}</span>
            <input
                type={type}
                className="control"
                value={value}
                placeholder={placeholder}
                onChange={(e) => set(e.target.value)}
            />
        </label>
    );
}
function Select({
    label,
    value,
    set,
    options,
}: {
    label: string;
    value: string;
    set: (v: string) => void;
    options: string[];
}) {
    return (
        <label>
            <span className="label">{label}</span>
            <SearchableSelect
                className="control"
                value={value}
                onChange={(e) => set(e.target.value)}
            >
                {options.map((x) => (
                    <option key={x} value={x}>
                        {x.replaceAll("_", " ")}
                    </option>
                ))}
            </SearchableSelect>
        </label>
    );
}
function SelectMap({
    label,
    value,
    set,
    rows,
    optional = false,
}: {
    label: string;
    value: string;
    set: (v: string) => void;
    rows: any[];
    optional?: boolean;
}) {
    return (
        <label>
            <span className="label">{label}</span>
            <SearchableSelect
                className="control"
                value={value}
                onChange={(e) => set(e.target.value)}
            >
                {optional && <option value="">Tanpa induk</option>}
                <option value="">Pilih...</option>
                {rows.map((x) => (
                    <option key={x.id} value={x.id}>
                        {x.name}
                    </option>
                ))}
            </SearchableSelect>
        </label>
    );
}
