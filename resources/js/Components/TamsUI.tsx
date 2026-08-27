import { Link } from "@inertiajs/react";
import { Box, ChevronRight } from "lucide-react";
import {
    useEffect,
    useState,
    type PropsWithChildren,
    type ReactNode,
} from "react";
import { statusMeta, toneClass } from "@/lib/ui";

export function Panel({
    children,
    className = "",
}: PropsWithChildren<{ className?: string }>) {
    return <section className={`panel ${className}`}>{children}</section>;
}
export function StatusBadge({ status }: { status: string }) {
    const meta = statusMeta[status] ?? {
        label: status.replaceAll("_", " "),
        tone: "muted",
        icon: ClockIcon,
    };
    const Icon = meta.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${toneClass[meta.tone]}`}
        >
            <Icon size={13} />
            {meta.label}
        </span>
    );
}
function ClockIcon() {
    return <span className="size-2 rounded-full bg-current" />;
}
export function PageHeader({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {eyebrow && (
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[.18em] text-green">
                        {eyebrow}
                    </p>
                )}
                <h1 className="font-display text-4xl font-bold leading-none sm:text-5xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 max-w-2xl text-sm text-muted">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
export function EmptyState({
    title = "Belum ada data",
    description = "Data akan tampil di sini setelah tersedia.",
}: {
    title?: string;
    description?: string;
}) {
    return (
        <div className="p-12 text-center">
            <Box className="mx-auto mb-3 text-muted" />
            <h3 className="font-display text-2xl font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
    );
}
export function TokenMeter({ used, total }: { used: number; total: number }) {
    const left = Math.max(0, total - used);
    return (
        <Panel className="overflow-hidden">
            <div className="hazard-stripe h-2" />
            <div className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted">
                    Kuota Peminjaman
                </p>
                <div className="mt-2 flex items-end justify-between">
                    <div>
                        <span className="font-num text-4xl font-semibold">
                            {left}
                        </span>
                        <span className="ml-2 text-sm text-muted">
                            dari {total} token
                        </span>
                    </div>
                    <span className="text-xs font-semibold text-muted">
                        {used} terpakai
                    </span>
                </div>
                <div className="mt-4 grid grid-cols-10 gap-1">
                    {Array.from({ length: total }).map((_, i) => (
                        <span
                            key={i}
                            className={`h-2 rounded-sm ${i < used ? "bg-amber" : "bg-green"}`}
                        />
                    ))}
                </div>
            </div>
        </Panel>
    );
}
export function Pagination({
    links,
}: {
    links: { url: string | null; label: string; active: boolean }[];
}) {
    return (
        <div className="flex flex-wrap gap-1 border-t p-3">
            {links.map((link, i) =>
                link.url ? (
                    <Link
                        key={i}
                        href={link.url}
                        className={`rounded px-3 py-2 text-xs font-semibold ${link.active ? "bg-ink text-white" : "hover:bg-canvas"}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={i}
                        className="px-3 py-2 text-xs text-muted/50"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </div>
    );
}
export function AssetGlyph({
    code,
    className = "",
}: {
    code: string;
    className?: string;
}) {
    return (
        <div
            className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#e7e4da] ${className}`}
        >
            <div className="absolute inset-0 bg-grid opacity-60" />
            <div className="relative flex size-20 rotate-3 items-center justify-center rounded-full border-2 border-ink/20 bg-surface shadow-lg">
                <span className="font-display text-xl font-bold text-ink">
                    {code.split("-").pop()}
                </span>
            </div>
            <span className="absolute bottom-2 right-2 font-num text-[10px] text-muted">
                {code}
            </span>
        </div>
    );
}

export function AssetVisual({
    code,
    imageUrl,
    alt,
    className = "",
    eager = false,
}: {
    code: string;
    imageUrl?: string | null;
    alt: string;
    className?: string;
    eager?: boolean;
}) {
    const [failed, setFailed] = useState(false);

    useEffect(() => setFailed(false), [imageUrl]);

    if (!imageUrl || failed) {
        return <AssetGlyph code={code} className={className} />;
    }

    return (
        <div
            className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#e7e4da] ${className}`}
        >
            <div className="absolute inset-0 bg-grid opacity-35" />
            <img
                src={imageUrl}
                alt={alt}
                loading={eager ? "eager" : "lazy"}
                decoding="async"
                onError={() => setFailed(true)}
                className="relative size-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-2 right-2 rounded bg-surface/90 px-2 py-1 font-num text-[10px] font-bold text-muted shadow-sm backdrop-blur">
                {code}
            </span>
        </div>
    );
}
export function RowLink({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="group flex items-center justify-between gap-4 border-b border-line px-4 py-3 last:border-0 hover:bg-canvas/70"
        >
            <div className="min-w-0 flex-1">{children}</div>
            <ChevronRight
                size={18}
                className="shrink-0 text-muted group-hover:translate-x-1 group-hover:text-ink"
            />
        </Link>
    );
}
