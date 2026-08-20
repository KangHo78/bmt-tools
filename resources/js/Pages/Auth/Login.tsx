import { Head, useForm } from "@inertiajs/react";
import {
    ArrowRight,
    Boxes,
    Eye,
    EyeOff,
    KeyRound,
    ShieldCheck,
    Wrench,
} from "lucide-react";
import { FormEventHandler, useState } from "react";

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const [show, setShow] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "user@tams.id",
        password: "Bengkel#2026",
        remember: false,
    });
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post("/login", { onFinish: () => reset("password") });
    };
    return (
        <div className="min-h-screen bg-ink text-white">
            <Head title="Masuk" />
            <div className="grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
                <section className="relative hidden overflow-hidden border-r border-white/15 p-12 lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute inset-0 opacity-15 bg-grid" />
                    <div className="absolute -right-28 top-24 size-96 rounded-full border-[70px] border-amber/20" />
                    <div className="relative flex items-center gap-3">
                        <div className="grid size-12 place-items-center bg-amber font-display text-2xl font-bold text-ink">
                            T
                        </div>
                        <div>
                            <p className="font-display text-2xl font-bold leading-none">
                                TAMS
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[.22em] text-white/50">
                                Tools Asset Management
                            </p>
                        </div>
                    </div>
                    <div className="relative max-w-xl">
                        <p className="text-[11px] font-bold uppercase tracking-[.25em] text-amber">
                            Workshop Trowulan · Control System
                        </p>
                        <h1 className="mt-5 font-display text-7xl font-bold leading-[.88]">
                            SETIAP ALAT.
                            <br />
                            <span className="text-amber">TERLACAK.</span>
                            <br />
                            TERJAGA.
                        </h1>
                        <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/60">
                            Inventarisasi, sirkulasi token, inspeksi, dan
                            pemeliharaan dalam satu ruang kendali operasional.
                        </p>
                    </div>
                    <div className="relative grid grid-cols-3 gap-3">
                        <Feature icon={Boxes} label="Inventaris" />
                        <Feature icon={KeyRound} label="10 Token" />
                        <Feature icon={ShieldCheck} label="Audit Trail" />
                    </div>
                </section>
                <section className="relative flex items-center justify-center bg-canvas bg-grid p-5 text-ink sm:p-10">
                    <div className="w-full max-w-md">
                        <div className="mb-10 flex items-center gap-3 lg:hidden">
                            <div className="grid size-11 place-items-center bg-ink font-display text-xl font-bold text-white">
                                T
                            </div>
                            <div>
                                <p className="font-display text-xl font-bold">
                                    TAMS
                                </p>
                                <p className="text-[9px] uppercase tracking-widest text-muted">
                                    Workshop Trowulan
                                </p>
                            </div>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[.2em] text-green">
                            Secure access point
                        </p>
                        <h2 className="mt-2 font-display text-5xl font-bold">
                            Masuk ke Sistem
                        </h2>
                        <p className="mt-3 text-sm text-muted">
                            Gunakan akun yang terdaftar untuk mengakses ruang
                            kerja Anda.
                        </p>
                        {status && (
                            <div className="mt-5 rounded border border-green/30 bg-green/10 p-3 text-sm text-green">
                                {status}
                            </div>
                        )}
                        <form
                            onSubmit={submit}
                            className="panel mt-8 p-5 sm:p-7"
                        >
                            <label>
                                <span className="label">Email</span>
                                <input
                                    type="email"
                                    autoComplete="username"
                                    className="control"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    autoFocus
                                />
                                {errors.email && (
                                    <span className="mt-1 block text-xs text-red">
                                        {errors.email}
                                    </span>
                                )}
                            </label>
                            <label className="mt-5 block">
                                <span className="label">Password</span>
                                <div className="relative">
                                    <input
                                        type={show ? "text" : "password"}
                                        autoComplete="current-password"
                                        className="control pr-12"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShow(!show)}
                                        className="absolute right-2 top-2 grid size-8 place-items-center text-muted"
                                        aria-label="Tampilkan password"
                                    >
                                        {show ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="mt-1 block text-xs text-red">
                                        {errors.password}
                                    </span>
                                )}
                            </label>
                            <label className="mt-5 flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="size-4 accent-green"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                />
                                Ingat sesi saya
                            </label>
                            <button
                                disabled={processing}
                                className="btn-primary mt-6 w-full"
                            >
                                {processing
                                    ? "Memverifikasi..."
                                    : "Masuk ke Control Desk"}
                                <ArrowRight size={17} />
                            </button>
                        </form>
                        <div className="mt-5 rounded border border-line bg-surface/60 p-4 text-xs text-muted">
                            <p className="font-bold uppercase tracking-wider text-ink">
                                Akun demo
                            </p>
                            <p className="mt-2 font-num">
                                user@tams.id · Bengkel#2026
                            </p>
                            <p className="mt-1">
                                Ganti email menjadi petugas@tams.id,
                                kepala@tams.id, atau admin@tams.id untuk melihat
                                role lain.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
function Feature({ icon: Icon, label }: { icon: any; label: string }) {
    return (
        <div className="border border-white/15 bg-white/5 p-4">
            <Icon className="text-amber" size={20} />
            <p className="mt-3 text-xs font-semibold text-white/70">{label}</p>
        </div>
    );
}
