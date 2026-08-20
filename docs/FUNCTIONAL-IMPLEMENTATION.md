# Matriks Implementasi PRD Fungsional

Dokumen ini memetakan kebutuhan pada PRD Fungsional ke modul aplikasi TAMS versi pertama.

| Area | Implementasi | Status |
|---|---|---|
| Akses dan pengguna | Login, role Peminjam/Petugas/Kepala Logistik/Admin, aktivasi akun, blokir akun nonaktif | Selesai |
| Penerimaan aset | Header penerimaan, rincian item, kondisi awal, kode unit unik, lokasi awal | Selesai |
| Identifikasi aset | Asset code dan label QR yang dapat dicetak serta dipindai | Selesai |
| Penyimpanan | Master lokasi, kapasitas, penempatan unit, riwayat mutasi | Selesai |
| Token | Saldo 10 token per pengguna, reservasi dan pelepasan token per jenis alat | Selesai |
| Peminjaman internal | Permohonan, tenggat Jumat, serah-terima, status transaksi | Selesai |
| Peminjaman eksternal | Surat wajib, approval Kepala Logistik, periode pinjam | Selesai |
| Perpanjangan | Permohonan user serta approval/reject untuk peminjaman eksternal | Selesai |
| Pengembalian | Checklist, pemeriksaan bersama, kondisi, kelengkapan, catatan, foto | Selesai |
| Kerusakan/kehilangan | Kasus otomatis, berita acara, bukti, keputusan, penggantian, penutupan | Selesai |
| Pemeliharaan | Jadwal, jenis pekerjaan, pelaksana, biaya, foto, penguncian status unit | Selesai |
| Stock opname | Snapshot, scan/kode aset, selisih, unit tidak ditemukan, rekonsiliasi | Selesai |
| Notifikasi | Pusat notifikasi, baca/baca semua, reminder dan status terlambat terjadwal | Selesai |
| Laporan | Ringkasan aset/pinjaman/audit, ekspor CSV, cetak atau simpan PDF | Selesai |
| Administrasi | Master alat, kategori, lokasi, pengguna, parameter sistem, audit trail | Selesai |

## Automasi

Scheduler Laravel menjalankan `loans:refresh-status` setiap jam dan `loans:send-reminders` setiap hari pukul 08.00. Nilai hari pengingat mengikuti parameter `reminder_days_before_due` pada administrasi sistem.

## Batas versi pertama

- Kanal notifikasi saat ini berada di dalam aplikasi; email/WhatsApp dapat ditambahkan sebagai integrasi berikutnya.
- Ekspor data terstruktur tersedia sebagai CSV yang kompatibel dengan Excel. Tampilan laporan dapat dicetak atau disimpan sebagai PDF melalui browser.
