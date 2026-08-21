import { Head, router } from "@inertiajs/react";
import {
    ArrowRight,
    Boxes,
    KeyRound,
    MapPinned,
    Pencil,
    Plus,
    Settings,
    Tags,
    Trash2,
    Users,
    UserPlus,
} from "lucide-react";
import { useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import SearchableSelect from "@/Components/SearchableSelect";
import { PageHeader, Panel, StatusBadge } from "@/Components/TamsUI";
import LocationTree from "@/Components/LocationTree";
import { formatDateTime, roleLabels } from "@/lib/ui";

export default function Admin(props: {
    users: any[];
    borrowers: any[];
    activity: any[];
    categories: any[];
    locations: any[];
    toolTypes: any[];
    masterItems: any[];
    settings: any[];
}) {
    const [tab, setTab] = useState("users");
    const tabs = [
        ["users", "Pengguna", Users],
        ["borrowers", "Peminjam & Token", KeyRound],
        ["master", "Master Aset", Boxes],
        ["categories", "Kategori", Tags],
        ["locations", "Lokasi", MapPinned],
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
            {tab === "categories" && (
                <CategoriesTab categories={props.categories} />
            )}{" "}
            {tab === "locations" && (
                <LocationsTab locations={props.locations} />
            )}{" "}
            {tab === "settings" && <SettingsTab settings={props.settings} />}{" "}
            {tab === "activity" && <Activity rows={props.activity} />}
        </TamsLayout>
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
function MasterTab({ toolTypes, masterItems, categories, locations }: any) {
    const [edit, setEdit] = useState<any>(null);
    const [deleting, setDeleting] = useState<any>(null);
    const [d, setD] = useState({
        sso_item_id: "",
        category_id: "",
        primary_location_id: "",
        rules_summary: "",
        checklist_text: "",
    });
    const selectedItem = masterItems.find(
        (item: any) => String(item.id) === String(d.sso_item_id),
    );
    return (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <Panel className="overflow-hidden">
                <div className="border-b p-5">
                    <h2 className="font-display text-2xl font-bold">
                        Jenis Alat
                    </h2>
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
                        />
                        <label>
                            <span className="label">
                                Checklist, satu per baris
                            </span>
                            <textarea
                                className="control min-h-24"
                                value={d.checklist_text}
                                onChange={(e) =>
                                    setD({
                                        ...d,
                                        checklist_text: e.target.value,
                                    })
                                }
                            />
                        </label>
                        <button
                            disabled={
                                !d.sso_item_id ||
                                !d.category_id ||
                                !d.primary_location_id ||
                                !d.checklist_text
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
                    close={() => setEdit(null)}
                />
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
function EditToolType({
    tool,
    masterItems,
    categories,
    locations,
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
        checklist_text: (tool.checklist ?? []).join("\n"),
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
                />
                <div className="sm:col-span-2">
                    <Textarea
                        label="Checklist, satu per baris"
                        value={d.checklist_text}
                        set={(v) => setD({ ...d, checklist_text: v })}
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
}: {
    label: string;
    value: string;
    set: (v: string) => void;
}) {
    return (
        <label>
            <span className="label">{label}</span>
            <textarea
                className="control min-h-24 resize-y"
                value={value}
                onChange={(e) => set(e.target.value)}
            />
        </label>
    );
}
function Input({
    label,
    value,
    set,
    type = "text",
}: {
    label: string;
    value: any;
    set: (v: string) => void;
    type?: string;
}) {
    return (
        <label>
            <span className="label">{label}</span>
            <input
                type={type}
                className="control"
                value={value}
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
