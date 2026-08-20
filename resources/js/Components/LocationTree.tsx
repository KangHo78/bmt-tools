import { CornerDownRight, MapPinned } from "lucide-react";

type LocationRow = {
    id: number;
    name: string;
    type: string;
    parent_id?: number | null;
    capacity?: number | null;
    units_count?: number;
};

export default function LocationTree({
    locations,
    showUnits = true,
}: {
    locations: LocationRow[];
    showUnits?: boolean;
}) {
    const ids = new Set(locations.map((location) => location.id));
    const children = new Map<number | null, LocationRow[]>();

    for (const location of locations) {
        const parentId =
            location.parent_id && ids.has(location.parent_id)
                ? location.parent_id
                : null;
        children.set(parentId, [...(children.get(parentId) ?? []), location]);
    }

    for (const rows of children.values()) {
        rows.sort((a, b) => a.name.localeCompare(b.name, "id"));
    }

    const renderBranch = (
        parentId: number | null,
        depth = 0,
        visited = new Set<number>(),
    ): React.ReactNode =>
        (children.get(parentId) ?? []).map((location) => {
            if (visited.has(location.id)) return null;
            const nextVisited = new Set(visited).add(location.id);
            const hasChildren = (children.get(location.id) ?? []).length > 0;

            return (
                <div key={location.id}>
                    <div
                        className="group relative grid min-h-16 gap-3 border-b border-line/80 pr-4 transition-colors last:border-0 hover:bg-canvas/70 sm:grid-cols-[minmax(0,1fr)_110px_150px] sm:items-center"
                        style={{ paddingLeft: `${16 + depth * 30}px` }}
                    >
                        {depth > 0 && (
                            <>
                                <span
                                    className="absolute bottom-0 top-0 w-px bg-line"
                                    style={{ left: `${29 + (depth - 1) * 30}px` }}
                                />
                                <span
                                    className="absolute top-1/2 h-px w-4 bg-line"
                                    style={{ left: `${29 + (depth - 1) * 30}px` }}
                                />
                            </>
                        )}
                        <div className="flex min-w-0 items-center gap-3 py-3">
                            <span
                                className={`grid size-9 shrink-0 place-items-center rounded-md border ${depth === 0 ? "border-amber/60 bg-amber/15 text-amber-ink" : "border-line bg-white text-muted"}`}
                            >
                                {depth === 0 ? (
                                    <MapPinned size={17} />
                                ) : (
                                    <CornerDownRight size={16} />
                                )}
                            </span>
                            <div className="min-w-0">
                                <strong className="block truncate">
                                    {location.name}
                                </strong>
                                <small>
                                    {hasChildren
                                        ? `${children.get(location.id)?.length} sublokasi`
                                        : "Lokasi akhir"}
                                </small>
                            </div>
                        </div>
                        <div className="pb-2 sm:py-3">
                            <span className="inline-flex rounded border border-line bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                                {location.type}
                            </span>
                        </div>
                        <div className="flex gap-5 pb-3 text-xs sm:justify-end sm:py-3">
                            <span>
                                <small>Kapasitas</small>
                                <strong className="mt-0.5 block font-num">
                                    {location.capacity ?? "—"}
                                </strong>
                            </span>
                            {showUnits && (
                                <span>
                                    <small>Terisi</small>
                                    <strong className="mt-0.5 block font-num">
                                        {location.units_count ?? 0} unit
                                    </strong>
                                </span>
                            )}
                        </div>
                    </div>
                    {renderBranch(location.id, depth + 1, nextVisited)}
                </div>
            );
        });

    return <div>{renderBranch(null)}</div>;
}
