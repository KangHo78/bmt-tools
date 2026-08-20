import { Head } from "@inertiajs/react";
import TamsLayout from "@/Layouts/TamsLayout";
import {
    EmptyState,
    PageHeader,
    Panel,
    StatusBadge,
} from "@/Components/TamsUI";
import { formatDate } from "@/lib/ui";
import LocationTree from "@/Components/LocationTree";

export default function Registry({
    kind,
    title,
    subtitle,
    rows,
}: {
    kind: string;
    title: string;
    subtitle: string;
    rows: any[];
}) {
    if (kind === "locations") {
        return (
            <TamsLayout>
                <Head title={title} />
                <PageHeader
                    eyebrow="Operations registry"
                    title={title}
                    description={subtitle}
                />
                <Panel className="overflow-hidden">
                    {rows.length ? (
                        <LocationTree locations={rows} />
                    ) : (
                        <EmptyState />
                    )}
                </Panel>
            </TamsLayout>
        );
    }

    return (
        <TamsLayout>
            <Head title={title} />
            <PageHeader
                eyebrow="Operations registry"
                title={title}
                description={subtitle}
            />
            <Panel className="overflow-hidden">
                {rows.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="border-b bg-ink text-[10px] uppercase tracking-[.12em] text-white">
                                <RegistryHead kind={kind} />
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <RegistryRow
                                        key={row.id}
                                        kind={kind}
                                        row={row}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState />
                )}
            </Panel>
        </TamsLayout>
    );
}
function RegistryHead({ kind }: { kind: string }) {
    const headers: Record<string, string[]> = {
        inventory: ["Kode Aset", "Jenis Alat", "Lokasi", "Kondisi", "Status"],
        locations: ["Lokasi", "Tipe", "Induk", "Kapasitas", "Terisi"],
        maintenance: ["Work Order", "Unit", "Tindakan", "Jadwal", "Status"],
        audits: ["Nama Audit", "Cakupan", "Petugas", "Progres", "Status"],
        cases: [
            "Nomor Kasus",
            "Unit",
            "Penanggung Jawab",
            "Kronologi",
            "Tahap",
        ],
    };
    return (
        <tr>
            {(headers[kind] ?? []).map((x) => (
                <th key={x} className="p-4">
                    {x}
                </th>
            ))}
        </tr>
    );
}
function RegistryRow({ kind, row }: { kind: string; row: any }) {
    if (kind === "inventory")
        return (
            <tr className="border-b last:border-0 hover:bg-canvas/60">
                <Cell mono>{row.asset_code}</Cell>
                <Cell>
                    <strong>{row.tool_type?.name}</strong>
                    <small>{row.serial_number}</small>
                </Cell>
                <Cell>{row.location?.name ?? "—"}</Cell>
                <Cell>{row.condition.replaceAll("_", " ")}</Cell>
                <Cell>
                    <StatusBadge status={row.status} />
                </Cell>
            </tr>
        );
    if (kind === "locations")
        return (
            <tr className="border-b last:border-0">
                <Cell>
                    <strong>{row.name}</strong>
                </Cell>
                <Cell>{row.type}</Cell>
                <Cell>{row.parent?.name ?? "—"}</Cell>
                <Cell>{row.capacity ?? "—"}</Cell>
                <Cell>{row.units_count} unit</Cell>
            </tr>
        );
    if (kind === "maintenance")
        return (
            <tr className="border-b last:border-0">
                <Cell mono>{row.work_order_no}</Cell>
                <Cell>
                    <strong>{row.unit?.tool_type?.name}</strong>
                    <small>{row.unit?.asset_code}</small>
                </Cell>
                <Cell>{row.action}</Cell>
                <Cell>{formatDate(row.scheduled_date)}</Cell>
                <Cell>
                    <StatusBadge status={row.status} />
                </Cell>
            </tr>
        );
    if (kind === "audits")
        return (
            <tr className="border-b last:border-0">
                <Cell>
                    <strong>{row.name}</strong>
                </Cell>
                <Cell>{row.scope}</Cell>
                <Cell>{row.assigned_to ?? "—"}</Cell>
                <Cell>
                    <div className="min-w-36">
                        <div className="mb-1 flex justify-between text-xs">
                            <span>
                                {row.checked_units}/{row.total_units}
                            </span>
                            <span>
                                {row.total_units
                                    ? Math.round(
                                          (row.checked_units /
                                              row.total_units) *
                                              100,
                                      )
                                    : 0}
                                %
                            </span>
                        </div>
                        <div className="h-1.5 rounded bg-line">
                            <div
                                className="h-full rounded bg-green"
                                style={{
                                    width: `${row.total_units ? (row.checked_units / row.total_units) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>
                </Cell>
                <Cell>
                    <StatusBadge status={row.status} />
                </Cell>
            </tr>
        );
    return (
        <tr className="border-b last:border-0">
            <Cell mono>{row.case_no}</Cell>
            <Cell>
                <strong>{row.unit?.tool_type?.name}</strong>
                <small>{row.unit?.asset_code}</small>
            </Cell>
            <Cell>{row.responsible_user?.name ?? "—"}</Cell>
            <Cell>
                <p className="max-w-md line-clamp-2">{row.chronology}</p>
            </Cell>
            <Cell>
                <StatusBadge status={row.stage} />
            </Cell>
        </tr>
    );
}
function Cell({ children, mono = false }: { children: any; mono?: boolean }) {
    return (
        <td className={`p-4 align-middle ${mono ? "font-num font-bold" : ""}`}>
            {children}
        </td>
    );
}
