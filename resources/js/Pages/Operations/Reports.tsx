import { Head, Link } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowUpRight,
    Boxes,
    ClipboardList,
    FileClock,
    ListTree,
    ScanLine,
    Sparkles,
    UserRound,
    Wrench,
} from "lucide-react";
import TamsLayout from "@/Layouts/TamsLayout";
import { PageHeader, Panel } from "@/Components/TamsUI";

const reports = [
    {
        key: "assets",
        href: "/laporan/aset",
        label: "Laporan Aset",
        description: "Posisi, kondisi, lokasi, dan status seluruh unit aset.",
        icon: Boxes,
        accent: "bg-green",
    },
    {
        key: "loans",
        href: "/laporan/peminjaman",
        label: "Laporan Peminjaman",
        description:
            "Riwayat transaksi, volume bulanan, dan status peminjaman.",
        icon: ClipboardList,
        accent: "bg-amber",
    },
    {
        key: "active_users",
        href: "/laporan/pengguna-aktif",
        label: "Pengguna Aktif",
        description: "Peminjam yang masih memegang unit dan tenggatnya.",
        icon: UserRound,
        accent: "bg-blue",
    },
    {
        key: "borrowed_items",
        href: "/laporan/item-dipinjam",
        label: "Item Dipinjam",
        description:
            "Sirkulasi aktif yang dikelompokkan berdasarkan jenis alat.",
        icon: ListTree,
        accent: "bg-ink",
    },
    {
        key: "audits",
        href: "/laporan/audit",
        label: "Laporan Audit",
        description:
            "Rekap stock opname, cakupan, progres, dan hasil pemeriksaan.",
        icon: ScanLine,
        accent: "bg-red",
    },
] as const;

const recommendations = [
    {
        icon: Wrench,
        label: "Pemeliharaan & Biaya",
        note: "jadwal, downtime, vendor, dan total biaya",
    },
    {
        icon: AlertTriangle,
        label: "Kerusakan & Kehilangan",
        note: "kasus, penyelesaian, dan aset pengganti",
    },
    {
        icon: FileClock,
        label: "Penerimaan & Mutasi",
        note: "aset masuk dan perpindahan antar lokasi",
    },
    {
        icon: Sparkles,
        label: "Utilisasi Alat",
        note: "alat paling sering/jarang digunakan dan idle time",
    },
];

export default function Reports({
    counts,
}: {
    counts: Record<string, number>;
}) {
    return (
        <TamsLayout>
            <Head title="Pusat Laporan" />
            <PageHeader
                eyebrow="Management reports"
                title="Pusat Laporan"
                description="Setiap laporan kini berdiri sendiri agar lebih mudah dibaca, dicetak, dan diekspor."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reports.map(
                    (
                        { key, href, label, description, icon: Icon, accent },
                        index,
                    ) => (
                        <Link key={key} href={href} className="group">
                            <Panel className="relative h-full overflow-hidden p-5 transition duration-200 group-hover:-translate-y-1 group-hover:border-ink group-hover:shadow-lg">
                                <div
                                    className={`absolute inset-x-0 top-0 h-1 ${accent}`}
                                />
                                <div className="flex items-start justify-between gap-4">
                                    <div className="grid size-11 place-items-center rounded-md border border-line bg-canvas text-ink">
                                        <Icon size={21} />
                                    </div>
                                    <span className="font-num text-[10px] font-bold tracking-[.18em] text-muted">
                                        REPORT{" "}
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                </div>
                                <p className="mt-8 font-num text-4xl font-semibold">
                                    {counts[key] ?? 0}
                                </p>
                                <h2 className="mt-3 font-display text-2xl font-bold">
                                    {label}
                                </h2>
                                <p className="mt-1 min-h-10 text-sm leading-relaxed text-muted">
                                    {description}
                                </p>
                                <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green">
                                    Buka laporan{" "}
                                    <ArrowUpRight
                                        size={15}
                                        className="transition group-hover:translate-x-1 group-hover:-translate-y-1"
                                    />
                                </span>
                            </Panel>
                        </Link>
                    ),
                )}
            </div>

            <Panel className="mt-6 overflow-hidden">
                <div className="grid lg:grid-cols-[.7fr_1.3fr]">
                    <div className="bg-ink p-6 text-white">
                        <p className="font-num text-[10px] font-bold uppercase tracking-[.2em] text-amber">
                            Gap analysis
                        </p>
                        <h2 className="mt-2 font-display text-3xl font-bold">
                            Laporan yang belum tersedia
                        </h2>
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
                            Data dasarnya sudah dicatat oleh modul operasional.
                            Empat laporan ini paling masuk akal untuk tahap
                            berikutnya.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2">
                        {recommendations.map(({ icon: Icon, label, note }) => (
                            <div
                                key={label}
                                className="border-b border-line p-5 sm:border-l"
                            >
                                <Icon size={19} className="text-green" />
                                <h3 className="mt-4 font-display text-lg font-bold">
                                    {label}
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-muted">
                                    {note}
                                </p>
                                <span className="mt-3 inline-block rounded-full border border-line bg-canvas px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-muted">
                                    Belum tersedia
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </Panel>
        </TamsLayout>
    );
}
