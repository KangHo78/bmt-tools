import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserView } from "./UserView";
import { PetugasView } from "./PetugasView";
import { KepalaView } from "./KepalaView";
import { AdminView } from "./AdminView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  switch (user.role) {
    case "petugas":
      return <PetugasView user={user} />;
    case "kepala_logistik":
      return <KepalaView user={user} />;
    case "admin":
      return <AdminView user={user} />;
    default:
      return <UserView user={user} />;
  }
}
