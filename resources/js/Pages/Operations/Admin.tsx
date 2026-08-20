import { Head, router } from "@inertiajs/react";
import {
    Boxes,
    MapPinned,
    Pencil,
    Settings,
    Tags,
    Trash2,
    Users,
} from "lucide-react";
import { useState } from "react";
import TamsLayout from "@/Layouts/TamsLayout";
import { PageHeader, Panel, StatusBadge } from "@/Components/TamsUI";
import LocationTree from "@/Components/LocationTree";
import { formatDateTime, roleLabels } from "@/lib/ui";

export default function Admin(props: {
    users: any[];
    activity: any[];
    categories: any[];
    locations: any[];
    toolTypes: any[];
    settings: any[];
}) {
    const [tab, setTab] = useState("users");
    const tabs = [
        ["users", "Pengguna", Users],
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
                description="Kelola akses, kuota token, master data, parameter, dan audit trail."
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
function UsersTab({ users }: { users: any[] }) {
    const [edit, setEdit] = useState<any>(null);
    return (
        <Panel className="overflow-hidden">
            <div className="border-b p-5">
                <h2 className="font-display text-2xl font-bold">
                    Pengguna & Token
                </h2>
                <p className="mt-1 text-sm text-muted">
                    Pengguna dan hak akses disinkronkan dari grup Tools Management pada aplikasi utama.
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-ink text-[10px] uppercase tracking-wider text-white">
                        <tr>
                            <th className="p-3">Pengguna</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Lembaga</th>
                            <th className="p-3">Token</th>
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
                                <td className="p-3 font-num font-bold">
                                    {u.token_used}/{u.token_quota}
                                </td>
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
        token_quota: user.token_quota,
        is_active: Boolean(user.is_active),
        reason: "",
    });
    return (
        <Modal title={`Akses ${user.name}`} close={close}>
            <div className="space-y-3">
                <p className="rounded-md border border-line bg-canvas p-3 text-sm">
                    Hak akses: <strong>{roleLabels[user.role]}</strong>. Ubah melalui grup pengguna di aplikasi utama.
                </p>
                <Input
                    label="Lembaga"
                    value={d.institution}
                    set={(v) => setD({ ...d, institution: v })}
                />
                <Input
                    label="Kuota token"
                    value={d.token_quota}
                    set={(v) => setD({ ...d, token_quota: Number(v) })}
                    type="number"
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
function MasterTab({ toolTypes, categories, locations }: any) {
    const [edit, setEdit] = useState<any>(null);
    const [deleting, setDeleting] = useState<any>(null);
    const [d, setD] = useState({
        code: "",
        name: "",
        category_id: "",
        primary_location_id: "",
        size: "",
        description: "",
        rules_summary: "",
        checklist_text: "",
    });
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
                    <div className="mt-4 space-y-3">
                        <Input
                            label="Kode"
                            value={d.code}
                            set={(v) => setD({ ...d, code: v.toUpperCase() })}
                        />
                        <Input
                            label="Nama"
                            value={d.name}
                            set={(v) => setD({ ...d, name: v })}
                        />
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
                        <Input
                            label="Ukuran/spesifikasi"
                            value={d.size}
                            set={(v) => setD({ ...d, size: v })}
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
function EditToolType({ tool, categories, locations, close }: any) {
    const [d, setD] = useState({
        code: tool.code ?? "",
        name: tool.name ?? "",
        category_id: String(tool.category_id ?? ""),
        primary_location_id: String(tool.primary_location_id ?? ""),
        size: tool.size ?? "",
        description: tool.description ?? "",
        rules_summary: tool.rules_summary ?? "",
        checklist_text: (tool.checklist ?? []).join("\n"),
    });
    return (
        <Modal title={`Ubah ${tool.name}`} close={close}>
            <div className="grid gap-3 sm:grid-cols-2">
                <Input
                    label="Kode"
                    value={d.code}
                    set={(v) => setD({ ...d, code: v.toUpperCase() })}
                />
                <Input
                    label="Nama"
                    value={d.name}
                    set={(v) => setD({ ...d, name: v })}
                />
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
                <Input
                    label="Ukuran/spesifikasi"
                    value={d.size}
                    set={(v) => setD({ ...d, size: v })}
                />
                <div />
                <Textarea
                    label="Deskripsi"
                    value={d.description}
                    set={(v) => setD({ ...d, description: v })}
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
                <EditCategory
                    category={edit}
                    close={() => setEdit(null)}
                />
            )}
            {deleting && (
                <ConfirmDelete
                    title="Hapus kategori?"
                    description={`${deleting.name} akan dihapus. Kategori yang masih digunakan master aset akan tetap dilindungi.`}
                    close={() => setDeleting(null)}
                    confirm={() =>
                        router.delete(
                            `/administrasi/kategori/${deleting.id}`,
                            { onSuccess: () => setDeleting(null) },
                        )
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
                        Area induk ditampilkan bersama seluruh ruang, rak, dan slot di bawahnya.
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
                Parameter ini mengatur batas dan perilaku proses aplikasi. Alasan perubahan disimpan di Audit Trail agar perubahan konfigurasi dapat ditelusuri; isinya tidak mengubah perhitungan sistem.
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
            <select
                className="control"
                value={value}
                onChange={(e) => set(e.target.value)}
            >
                {options.map((x) => (
                    <option key={x} value={x}>
                        {x.replaceAll("_", " ")}
                    </option>
                ))}
            </select>
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
            <select
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
            </select>
        </label>
    );
}
