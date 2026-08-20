# TAMS — Tools Asset Management System

Aplikasi pengelolaan alat kerja Workshop Trowulan berbasis Laravel, React, Inertia, TypeScript, dan Tailwind CSS.

## Fitur yang tersedia

- Dashboard berbeda untuk peminjam, petugas gudang, Kepala Logistik, dan administrator.
- Penerimaan aset, kode unit otomatis, label QR, inventaris, kondisi, lokasi, serta asset passport.
- Kuota 10 token dengan satu token untuk satu jenis alat aktif.
- Peminjaman dalam area dengan tenggat Jumat otomatis.
- Peminjaman luar area dengan surat dan approval Kepala Logistik.
- Serah-terima unit menggunakan kode aset dan konfirmasi kedua pihak.
- Pengembalian dengan inspeksi, checklist, catatan, dan foto wajib.
- Kasus kerusakan atau kehilangan otomatis dari hasil inspeksi.
- Mutasi lokasi, maintenance, stock opname bulanan, kasus kerusakan/kehilangan, dan rekonsiliasi.
- Notifikasi jatuh tempo, pencarian global, scan kode, laporan CSV, serta cetak/simpan PDF.
- Master data pengguna, alat, kategori, lokasi, parameter operasional, dan audit trail.
- Role-based access control dan activity log untuk transaksi kritis.

## Menjalankan aplikasi

Persyaratan lokal: PHP 8.3+, Composer, Node.js 22+, MySQL 8+, serta ekstensi PDO MySQL PHP.

```bash
composer install
npm install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link
npm run build
composer run dev
```

Buat database MySQL sebelum menjalankan migration:

```sql
CREATE DATABASE bmt_tools CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE bmt_tools_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Untuk development frontend terpisah, jalankan `php artisan serve` dan `npm run dev` pada dua terminal. Jalankan scheduler di terminal tambahan agar status terlambat dan pengingat otomatis diproses:

```bash
php artisan schedule:work
```

Database default adalah MySQL dengan nama `bmt_tools`. Sesuaikan `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, dan `DB_PASSWORD` pada `.env` bila kredensial lokal berbeda.

## Akun demo

Semua akun menggunakan password `Bengkel#2026`.

| Role | Email |
|---|---|
| Peminjam | `user@tams.id` |
| Petugas Gudang | `petugas@tams.id` |
| Kepala Logistik | `kepala@tams.id` |
| Administrator | `admin@tams.id` |

Registrasi publik dinonaktifkan. Pembuatan akun operasional dilakukan oleh administrator.

## Verifikasi

```bash
php artisan test
vendor/bin/pint --test
npm run build
```

Feature test mencakup penerimaan dan label, mutasi lokasi, maintenance, stock opname, reservasi dan pelepasan token, kewajiban surat, approval, perpanjangan, serah-terima, pengembalian, kasus aset, laporan, automasi, serta pembatasan role.

## Dokumen produk

- [PRD Fungsional](docs/PRD-FUNCTIONAL.md)
- [PRD UI/UX](docs/PRD-UI-UX.md)
- [Matriks Implementasi Fungsional](docs/FUNCTIONAL-IMPLEMENTATION.md)

Implementasi Next.js awal dipertahankan di `tools-asset-management-uiux/` sebagai referensi visual dan histori migrasi.
