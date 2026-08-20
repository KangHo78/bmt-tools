"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";
import { Eye, EyeOff, Wrench, LifeBuoy, Loader2 } from "lucide-react";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <main className="bg-grid flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-ink text-canvas">
            <Wrench size={24} strokeWidth={2.25} />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">TAMS</h1>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Tools Asset Management System</p>
        </div>

        <form action={formAction} className="panel space-y-4 p-6" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
              Identitas (email)
            </label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              required
              placeholder="nama@toolsense.id"
              className="tap-target w-full rounded border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-blue"
              aria-describedby={state.error ? "login-error" : undefined}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-semibold text-ink">
                Kata sandi
              </label>
              <button
                type="button"
                onClick={() => setShowHelp((v) => !v)}
                className="text-xs font-medium text-blue underline-offset-2 hover:underline"
              >
                Lupa password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="Masukkan kata sandi"
                className="tap-target w-full rounded border border-line bg-surface px-3 py-2.5 pr-11 text-sm outline-none focus:border-blue"
                aria-describedby={state.error ? "login-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="tap-target absolute inset-y-0 right-0 flex items-center px-3 text-muted"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {showHelp && (
            <p className="rounded border border-line bg-canvas p-3 text-xs text-muted">
              Hubungi Administrator Sistem melalui ext. 208 atau admin@toolsense.id untuk mengatur ulang kata sandi Anda.
            </p>
          )}

          {state.error && (
            <p id="login-error" role="alert" className="rounded border border-red/40 bg-red/10 px-3 py-2 text-sm font-medium text-red">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="tap-target flex w-full items-center justify-center gap-2 rounded bg-ink py-2.5 text-sm font-bold text-canvas transition-colors hover:bg-ink/85 disabled:opacity-60"
          >
            {pending && <Loader2 size={16} className="animate-spin" />}
            Masuk ke Sistem
          </button>
        </form>

        <div className="mt-4 flex items-start gap-2 rounded border border-line bg-surface/60 p-3 text-xs text-muted">
          <LifeBuoy size={16} className="mt-0.5 shrink-0" />
          <p>
            Butuh bantuan akses? Hubungi Admin Sistem di admin@toolsense.id. Akun demo tersedia untuk setiap peran
            (user1, petugas1, kepala, admin)@toolsense.id dengan kata sandi <span className="font-num">Bengkel#2026</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
