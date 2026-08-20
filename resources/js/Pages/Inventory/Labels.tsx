import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function Labels({ receipt }: { receipt: any }) {
    const units = receipt.items.flatMap((item: any) =>
        item.units.map((unit: any) => ({ ...unit, tool_type: item.tool_type })),
    );
    return (
        <div className="min-h-screen bg-white p-6 text-ink">
            <Head title={`Label ${receipt.reference_no}`} />
            <div className="mx-auto mb-6 flex max-w-5xl items-center justify-between print:hidden">
                <Link
                    href={`/inventaris/penerimaan/${receipt.id}`}
                    className="btn-secondary"
                >
                    <ArrowLeft size={17} />
                    Kembali
                </Link>
                <button onClick={() => window.print()} className="btn-primary">
                    <Printer size={17} />
                    Cetak Label
                </button>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-3">
                {units.map((u: any) => (
                    <div
                        key={u.id}
                        className="break-inside-avoid border-2 border-ink p-3"
                    >
                        <div className="flex gap-3">
                            <QRCodeSVG
                                value={`${window.location.origin}/scan/${encodeURIComponent(u.asset_code)}`}
                                size={76}
                                level="M"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between">
                                    <span className="bg-ink px-2 py-1 font-display text-sm font-bold text-white">
                                        TAMS
                                    </span>
                                    <span className="text-[8px] font-bold uppercase tracking-wider">
                                        Workshop Trowulan
                                    </span>
                                </div>
                                <h2 className="mt-2 truncate font-display text-xl font-bold leading-none">
                                    {u.tool_type.name}
                                </h2>
                                <p className="mt-2 font-num text-[11px] font-bold">
                                    {u.asset_code}
                                </p>
                                <p className="mt-1 text-[8px] uppercase tracking-wider">
                                    {receipt.owner_institution}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`@media print{@page{size:A4;margin:10mm}body{background:white}.print\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}`}</style>
        </div>
    );
}
