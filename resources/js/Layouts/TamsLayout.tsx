import { Link, router, usePage } from "@inertiajs/react";
import {
    AlertTriangle,
    BarChart3,
    Bell,
    Boxes,
    CheckSquare,
    ClipboardList,
    Gauge,
    LogOut,
    MapPinned,
    Menu,
    ScanLine,
    Search,
    Settings,
    ShieldAlert,
    Undo2,
    Warehouse,
    Wrench,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { PageProps, Role } from "@/types/tams";
import { roleLabels } from "@/lib/ui";
import { useLocale } from "@/lib/i18n";

const nav = [
    [
        "/dashboard",
        "Ringkasan",
        Gauge,
        ["user", "petugas", "kepala_logistik", "admin"],
    ],
    [
        "/katalog",
        "Katalog Alat",
        Boxes,
        ["user", "petugas", "kepala_logistik", "admin"],
    ],
    [
        "/peminjaman",
        "Peminjaman",
        ClipboardList,
        ["user", "petugas", "kepala_logistik", "admin"],
    ],
    ["/pengembalian", "Pengembalian", Undo2, ["petugas", "admin"]],
    ["/inventaris", "Inventaris", Warehouse, ["petugas", "admin"]],
    ["/lokasi", "Lokasi", MapPinned, ["petugas", "admin"]],
    ["/pemeliharaan", "Pemeliharaan", Wrench, ["petugas", "admin"]],
    ["/audit", "Audit Stok", ScanLine, ["petugas", "admin"]],
    ["/approval", "Approval", CheckSquare, ["kepala_logistik", "admin"]],
    ["/kasus", "Kasus", ShieldAlert, ["petugas", "kepala_logistik", "admin"]],
    ["/laporan", "Laporan", BarChart3, ["kepala_logistik", "admin"]],
    ["/administrasi", "Administrasi", Settings, ["admin"]],
] as [string, string, any, Role[]][];

export default function TamsLayout({ children }: PropsWithChildren) {
    const page = usePage<PageProps>();
    const { user, canApprove } = page.props.auth;
    const [menu, setMenu] = useState(false);
    const [search, setSearch] = useState(false);
    const [scan, setScan] = useState(false);
    const { locale, setLocale } = useLocale();
    const items = useMemo(
        () =>
            nav.filter(
                (x) =>
                    x[3].includes(user.role) &&
                    (x[0] !== "/approval" || canApprove),
            ),
        [user.role, canApprove],
    );
    useEffect(() => setMenu(false), [page.url]);
    return (
        <div className="min-h-screen bg-canvas bg-grid">
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-ink/15 bg-ink text-white transition-transform lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex h-20 items-center justify-between border-b border-white/15 px-5">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center border border-amber bg-amber font-display text-xl font-bold text-ink">
                            T
                        </div>
                        <div>
                            <div className="font-display text-xl font-bold leading-none">
                                TAMS
                            </div>
                            <div className="mt-1 text-[9px] uppercase tracking-[.2em] text-white/55">
                                Tracking Tools
                            </div>
                        </div>
                    </Link>
                    <button
                        onClick={() => setMenu(false)}
                        className="p-2 lg:hidden"
                        aria-label="Tutup menu"
                    >
                        <X />
                    </button>
                </div>
                <nav className="h-[calc(100vh-10rem)] overflow-y-auto p-3">
                    {items.map(([href, label, Icon]) => {
                        const active =
                            page.url === href ||
                            page.url.startsWith(href + "/");
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`mb-1 flex min-h-11 items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-semibold ${active ? "border-amber/60 bg-amber text-ink" : "border-transparent text-white/70 hover:border-white/15 hover:bg-white/5 hover:text-white"}`}
                            >
                                <Icon size={18} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="absolute inset-x-0 bottom-0 border-t border-white/15 p-3">
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-md p-2 hover:bg-white/5"
                    >
                        <div className="grid size-9 place-items-center rounded bg-green font-display text-lg font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                                {user.name}
                            </p>
                            <p className="truncate text-[10px] text-white/50">
                                {roleLabels[user.role]}
                            </p>
                        </div>
                    </Link>
                </div>
            </aside>
            {menu && (
                <button
                    className="fixed inset-0 z-30 bg-ink/55 lg:hidden"
                    onClick={() => setMenu(false)}
                    aria-label="Tutup navigasi"
                />
            )}
            <div className="min-h-screen lg:pl-72">
                <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
                    <button
                        className="p-2 lg:hidden"
                        onClick={() => setMenu(true)}
                        aria-label="Buka menu"
                    >
                        <Menu />
                    </button>
                    <button
                        onClick={() => setSearch(true)}
                        className="flex min-h-10 flex-1 items-center gap-2 rounded-md border border-line bg-canvas/70 px-3 text-left text-sm text-muted hover:border-ink sm:max-w-md"
                    >
                        <Search size={17} />
                        Cari alat, unit, atau transaksi...
                        <kbd className="ml-auto hidden rounded border bg-surface px-1.5 py-0.5 font-mono text-[10px] sm:block">
                            Ctrl K
                        </kbd>
                    </button>
                    <button
                        onClick={() => setScan(true)}
                        className="btn-secondary ml-auto !min-h-10 !px-3"
                    >
                        <ScanLine size={18} />
                        <span className="hidden sm:inline">Scan</span>
                    </button>
                    <div
                        className="flex h-10 shrink-0 items-center rounded-md border border-line bg-canvas p-1"
                        role="group"
                        aria-label={
                            locale === "id"
                                ? "Pilihan bahasa"
                                : "Language selection"
                        }
                    >
                        {(["id", "en"] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setLocale(option)}
                                aria-pressed={locale === option}
                                title={
                                    option === "id"
                                        ? "Bahasa Indonesia"
                                        : "English"
                                }
                                className={`grid h-8 min-w-9 place-items-center rounded px-2 font-num text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                    locale === option
                                        ? "bg-ink text-white shadow-sm"
                                        : "text-muted hover:bg-surface hover:text-ink"
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    <Link
                        href="/notifikasi"
                        className="relative grid size-10 place-items-center rounded-md border border-line bg-surface"
                        aria-label="Notifikasi"
                    >
                        <Bell size={18} />
                        {page.props.unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-red text-[10px] font-bold text-white">
                                {page.props.unreadCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="grid size-10 place-items-center rounded-md border border-line bg-surface"
                        aria-label="Kembali ke aplikasi utama"
                        title="Kembali ke aplikasi utama"
                    >
                        <LogOut size={18} />
                    </Link>
                </header>
                {page.props.flash?.success && (
                    <div className="mx-4 mt-4 flex items-center gap-2 rounded-md border border-green/30 bg-green/10 px-4 py-3 text-sm font-semibold text-green sm:mx-6">
                        <CheckSquare size={18} />
                        {page.props.flash.success}
                    </div>
                )}
                {page.props.flash?.error && (
                    <div className="mx-4 mt-4 flex items-center gap-2 rounded-md border border-red/30 bg-red/10 px-4 py-3 text-sm font-semibold text-red sm:mx-6">
                        <AlertTriangle size={18} />
                        {page.props.flash.error}
                    </div>
                )}
                <main className="page-enter p-4 pb-24 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
            <div className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-surface p-1 lg:hidden">
                {items.slice(0, 4).map(([href, label, Icon]) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${page.url.startsWith(href) ? "text-green" : "text-muted"}`}
                    >
                        <Icon size={19} />
                        {label.split(" ")[0]}
                    </Link>
                ))}
            </div>
            {search && <SearchDialog onClose={() => setSearch(false)} />}{" "}
            {scan && <ScanDialog onClose={() => setScan(false)} />}
        </div>
    );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
    const [q, setQ] = useState("");
    const [rows, setRows] = useState<any[]>([]);
    useEffect(() => {
        const id = setTimeout(() => {
            if (q.length < 2) {
                setRows([]);
                return;
            }
            fetch("/api/search?q=" + encodeURIComponent(q))
                .then((r) => r.json())
                .then(setRows);
        }, 220);
        return () => clearTimeout(id);
    }, [q]);
    useEffect(() => {
        const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, []);
    return (
        <div
            className="fixed inset-0 z-50 bg-ink/60 p-4 backdrop-blur-sm"
            onMouseDown={onClose}
        >
            <div
                className="panel mx-auto mt-[8vh] max-w-2xl overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 border-b p-4">
                    <Search />
                    <input
                        autoFocus
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="w-full bg-transparent text-lg outline-none"
                        placeholder="Ketik minimal 2 karakter..."
                    />
                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>
                <div className="max-h-[55vh] overflow-y-auto p-2">
                    {rows.map((row, i) => (
                        <Link
                            key={i}
                            href={row.href}
                            onClick={onClose}
                            className="flex items-center justify-between rounded-md p-3 hover:bg-canvas"
                        >
                            <div>
                                <p className="font-semibold">{row.label}</p>
                                <p className="font-num text-xs text-muted">
                                    {row.meta}
                                </p>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                {row.type}
                            </span>
                        </Link>
                    ))}
                    {q.length >= 2 && !rows.length && (
                        <p className="p-8 text-center text-sm text-muted">
                            Tidak ada hasil ditemukan.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
function ScanDialog({ onClose }: { onClose: () => void }) {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const r = await fetch("/api/scan?code=" + encodeURIComponent(code));
        if (r.ok) {
            const x = await r.json();
            router.visit(x.href);
        } else setError("Kode tidak ditemukan. Periksa label dan coba lagi.");
    };
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4">
            <form
                onSubmit={submit}
                className="panel w-full max-w-md overflow-hidden"
            >
                <div className="bg-ink p-6 text-white">
                    <div className="mb-4 flex justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber">
                                Scanner Gateway
                            </p>
                            <h2 className="font-display text-3xl font-bold">
                                Pindai Label
                            </h2>
                        </div>
                        <button type="button" onClick={onClose}>
                            <X />
                        </button>
                    </div>
                    <div className="relative mx-auto aspect-video max-w-sm border-2 border-amber/80 bg-white/5">
                        <span className="absolute left-4 top-4 size-5 border-l-2 border-t-2 border-amber" />
                        <span className="absolute bottom-4 right-4 size-5 border-b-2 border-r-2 border-amber" />
                        <ScanLine
                            className="absolute inset-0 m-auto text-white/30"
                            size={54}
                        />
                    </div>
                </div>
                <div className="p-5">
                    <label className="label">Input kode manual</label>
                    <input
                        autoFocus
                        className="control font-num"
                        placeholder="TWL-DRL-2026-0001 / TRX-1042"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    {error && <p className="mt-2 text-sm text-red">{error}</p>}
                    <button className="btn-primary mt-4 w-full">
                        <Search size={17} />
                        Cari Kode
                    </button>
                </div>
            </form>
        </div>
    );
}
