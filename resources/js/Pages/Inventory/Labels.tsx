import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Printer, Tag } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type LabelUnit = {
    id: number;
    asset_code: string;
    owner?: string | null;
    tool_type: { id: number; name: string; code: string };
};

export default function Labels({
    batch,
}: {
    batch: { title: string; back_url: string; units: LabelUnit[] };
}) {
    return (
        <div className="min-h-screen bg-white p-6 text-ink">
            <Head title={`Label ${batch.title}`} />
            <div className="mx-auto mb-6 flex max-w-5xl flex-wrap items-center justify-between gap-3 print:hidden">
                <div>
                    <Link href={batch.back_url} className="btn-secondary">
                        <ArrowLeft size={17} />
                        Kembali
                    </Link>
                    <p className="mt-3 text-sm text-muted">
                        {batch.units.length} label siap dicetak · {batch.title}
                    </p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="btn-primary"
                    disabled={batch.units.length === 0}
                >
                    <Printer size={17} />
                    Cetak {batch.units.length} Label
                </button>
            </div>
            {batch.units.length ? (
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-3">
                    {batch.units.map((unit) => (
                        <div
                            key={unit.id}
                            className="break-inside-avoid border-2 border-ink p-3"
                        >
                            <div className="flex gap-3">
                                <QRCodeSVG
                                    value={`${window.location.origin}/scan/${encodeURIComponent(unit.asset_code)}`}
                                    size={76}
                                    level="M"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="bg-ink px-2 py-1 font-display text-sm font-bold text-white">
                                            TAMS
                                        </span>
                                        <span className="text-right text-[8px] font-bold uppercase tracking-wider">
                                            Workshop Trowulan
                                        </span>
                                    </div>
                                    <h2 className="mt-2 truncate font-display text-xl font-bold leading-none">
                                        {unit.tool_type.name}
                                    </h2>
                                    <p className="mt-2 font-num text-[11px] font-bold">
                                        {unit.asset_code}
                                    </p>
                                    <p className="mt-1 truncate text-[8px] uppercase tracking-wider">
                                        {unit.owner || "TAMS Workshop Trowulan"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mx-auto grid min-h-72 max-w-5xl place-items-center border-2 border-dashed border-line bg-canvas/40 text-center print:hidden">
                    <div>
                        <Tag className="mx-auto text-muted" size={30} />
                        <h2 className="mt-3 font-display text-2xl font-bold">
                            Belum ada unit
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                            Label tersedia setelah unit ditambahkan melalui penerimaan inventory.
                        </p>
                    </div>
                </div>
            )}
            <style>{`@media print{@page{size:A4;margin:10mm}body{background:white}.print\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}`}</style>
        </div>
    );
}
