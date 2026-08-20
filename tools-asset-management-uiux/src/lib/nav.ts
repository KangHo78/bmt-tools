import {
  Gauge,
  Boxes,
  ClipboardList,
  Undo2,
  Warehouse,
  MapPinned,
  Wrench,
  ScanLine,
  ShieldAlert,
  BarChart3,
  Settings,
  CheckSquare,
  User,
  Home,
  type LucideIcon,
} from "lucide-react";

export type Role = "user" | "petugas" | "kepala_logistik" | "admin";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

export const SIDEBAR_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Ringkasan", icon: Gauge, roles: ["user", "petugas", "kepala_logistik", "admin"] },
  { href: "/katalog", label: "Katalog Alat", icon: Boxes, roles: ["user", "petugas", "kepala_logistik", "admin"] },
  { href: "/peminjaman", label: "Peminjaman", icon: ClipboardList, roles: ["user", "petugas", "kepala_logistik", "admin"] },
  { href: "/pengembalian", label: "Pengembalian", icon: Undo2, roles: ["petugas", "admin"] },
  { href: "/inventaris", label: "Inventaris", icon: Warehouse, roles: ["petugas", "admin"] },
  { href: "/lokasi", label: "Lokasi", icon: MapPinned, roles: ["petugas", "admin"] },
  { href: "/pemeliharaan", label: "Pemeliharaan", icon: Wrench, roles: ["petugas", "admin"] },
  { href: "/audit", label: "Audit Stok", icon: ScanLine, roles: ["petugas", "admin"] },
  { href: "/approval", label: "Approval", icon: CheckSquare, roles: ["kepala_logistik", "admin"] },
  { href: "/kasus", label: "Kasus", icon: ShieldAlert, roles: ["petugas", "kepala_logistik", "admin"] },
  { href: "/laporan", label: "Laporan", icon: BarChart3, roles: ["kepala_logistik", "admin"] },
  { href: "/administrasi", label: "Administrasi", icon: Settings, roles: ["admin"] },
];

export const MOBILE_ITEMS: Record<Role, NavItem[]> = {
  user: [
    { href: "/dashboard", label: "Beranda", icon: Home, roles: ["user"] },
    { href: "/katalog", label: "Katalog", icon: Boxes, roles: ["user"] },
    { href: "/scan", label: "Scan", icon: ScanLine, roles: ["user"] },
    { href: "/peminjaman", label: "Pinjaman", icon: ClipboardList, roles: ["user"] },
    { href: "/akun", label: "Akun", icon: User, roles: ["user"] },
  ],
  petugas: [
    { href: "/dashboard", label: "Beranda", icon: Home, roles: ["petugas"] },
    { href: "/pengembalian", label: "Kembali", icon: Undo2, roles: ["petugas"] },
    { href: "/scan", label: "Scan", icon: ScanLine, roles: ["petugas"] },
    { href: "/peminjaman", label: "Pinjaman", icon: ClipboardList, roles: ["petugas"] },
    { href: "/akun", label: "Akun", icon: User, roles: ["petugas"] },
  ],
  kepala_logistik: [
    { href: "/dashboard", label: "Beranda", icon: Home, roles: ["kepala_logistik"] },
    { href: "/approval", label: "Approval", icon: CheckSquare, roles: ["kepala_logistik"] },
    { href: "/scan", label: "Scan", icon: ScanLine, roles: ["kepala_logistik"] },
    { href: "/laporan", label: "Laporan", icon: BarChart3, roles: ["kepala_logistik"] },
    { href: "/akun", label: "Akun", icon: User, roles: ["kepala_logistik"] },
  ],
  admin: [
    { href: "/dashboard", label: "Beranda", icon: Home, roles: ["admin"] },
    { href: "/inventaris", label: "Inventaris", icon: Warehouse, roles: ["admin"] },
    { href: "/scan", label: "Scan", icon: ScanLine, roles: ["admin"] },
    { href: "/peminjaman", label: "Pinjaman", icon: ClipboardList, roles: ["admin"] },
    { href: "/akun", label: "Akun", icon: User, roles: ["admin"] },
  ],
};

export const MORE_ITEMS: Record<Role, NavItem[]> = {
  user: [],
  petugas: SIDEBAR_ITEMS.filter((i) => ["/inventaris", "/lokasi", "/pemeliharaan", "/audit", "/kasus"].includes(i.href)),
  kepala_logistik: SIDEBAR_ITEMS.filter((i) => ["/kasus", "/katalog"].includes(i.href)),
  admin: SIDEBAR_ITEMS.filter((i) => ["/lokasi", "/pemeliharaan", "/audit", "/kasus", "/laporan", "/administrasi"].includes(i.href)),
};
