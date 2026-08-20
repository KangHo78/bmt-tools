import { Head, Link, router } from "@inertiajs/react";
import { Bell, CheckCheck } from "lucide-react";
import TamsLayout from "@/Layouts/TamsLayout";
import { EmptyState, PageHeader, Pagination, Panel } from "@/Components/TamsUI";
import { formatDateTime } from "@/lib/ui";

export default function Index({ notifications }: { notifications: any }) {
    return (
        <TamsLayout>
            <Head title="Notifikasi" />
            <PageHeader
                eyebrow="Task inbox"
                title="Notifikasi"
                description="Peringatan tenggat, keputusan approval, dan tugas yang membutuhkan tindakan."
                action={
                    <button
                        onClick={() => router.post("/notifikasi/baca-semua")}
                        className="btn-secondary"
                    >
                        <CheckCheck size={17} />
                        Tandai Semua Dibaca
                    </button>
                }
            />
            <Panel className="overflow-hidden">
                {notifications.data.length ? (
                    notifications.data.map((n: any) => (
                        <div
                            key={n.id}
                            className={`flex gap-4 border-b p-4 last:border-0 ${n.read_at ? "bg-surface" : "bg-amber/5"}`}
                        >
                            <div
                                className={`grid size-10 shrink-0 place-items-center rounded ${n.category === "perlu_tindakan" ? "bg-red/10 text-red" : "bg-blue/10 text-blue"}`}
                            >
                                <Bell size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap justify-between gap-2">
                                    <p className="font-semibold">{n.title}</p>
                                    <span className="text-[10px] text-muted">
                                        {formatDateTime(n.created_at)}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-muted">
                                    {n.description}
                                </p>
                                <div className="mt-3 flex gap-2">
                                    {n.href && (
                                        <Link
                                            href={n.href}
                                            onClick={() =>
                                                !n.read_at &&
                                                router.post(
                                                    `/notifikasi/${n.id}/baca`,
                                                )
                                            }
                                            className="text-xs font-bold text-green"
                                        >
                                            Buka detail →
                                        </Link>
                                    )}
                                    {!n.read_at && (
                                        <button
                                            onClick={() =>
                                                router.post(
                                                    `/notifikasi/${n.id}/baca`,
                                                )
                                            }
                                            className="text-xs font-semibold text-muted"
                                        >
                                            Tandai dibaca
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState title="Belum ada notifikasi" />
                )}
                <Pagination links={notifications.links} />
            </Panel>
        </TamsLayout>
    );
}
