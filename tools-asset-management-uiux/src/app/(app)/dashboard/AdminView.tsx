import { KepalaView } from "./KepalaView";
import { Panel } from "@/components/ui/Panel";
import { LinkButton } from "@/components/ui/Button";
import { Settings } from "lucide-react";
import type { users } from "@/db/schema";

export async function AdminView({ user }: { user: typeof users.$inferSelect }) {
  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
        <Panel
          title="Administrasi Sistem"
          description="Kelola pengguna, lembaga, master data, dan konfigurasi kuota/tenggat."
          action={
            <LinkButton href="/administrasi" variant="secondary" size="sm" icon={<Settings size={14} />}>
              Buka Administrasi
            </LinkButton>
          }
        >
          <p className="text-sm text-muted">Anda masuk sebagai Administrator. Ringkasan operasional di bawah ini identik dengan tampilan Kepala Logistik.</p>
        </Panel>
      </div>
      <KepalaView user={user} />
    </div>
  );
}
