# Product Requirements Document — Fungsional

## Tools Asset Management System

| Atribut | Nilai |
|---|---|
| Versi | 1.0 |
| Status | Draft untuk review stakeholder |
| Area operasional | Workshop Trowulan dan luar Workshop Trowulan |
| Pemilik proses | Logistik / Petugas Gudang |
| Bahasa aplikasi | Bahasa Indonesia |

## 1. Ringkasan Produk

Tools Asset Management System adalah aplikasi untuk mengelola siklus hidup peralatan kerja sejak diterima, diidentifikasi, disimpan, dipinjam, dikembalikan, diperiksa, dirawat, diaudit, hingga dinyatakan hilang atau tidak layak pakai.

Sistem memusatkan data aset dan transaksi agar alat mudah ditemukan, ketersediaannya dapat diketahui secara real-time, peminjaman dapat dikendalikan dengan token, dan setiap kerusakan atau kehilangan memiliki pertanggungjawaban yang terdokumentasi.

## 2. Latar Belakang dan Masalah

Proses manual berisiko menimbulkan:

- Data jumlah, jenis, kondisi, dan lokasi alat yang tidak akurat.
- Kesulitan mengetahui alat sedang tersedia, dipinjam, rusak, atau diservis.
- Peminjaman melebihi batas tanpa tindak lanjut.
- Bukti surat, foto fisik, dan hasil pemeriksaan tersebar atau hilang.
- Kehilangan alat dan kerusakan tanpa jejak pertanggungjawaban.
- Audit stok bulanan yang lambat dan sulit direkonsiliasi.

## 3. Tujuan

- Menyediakan satu sumber data aset tools yang akurat.
- Memastikan setiap alat memiliki identitas dan lokasi penyimpanan yang jelas.
- Membatasi pinjaman aktif setiap user dengan sistem 10 token.
- Memastikan prosedur pinjam-kembali berbeda sesuai area penggunaan.
- Mendeteksi keterlambatan dan mengirim pengingat kepada pihak terkait.
- Mendokumentasikan kondisi, kelengkapan, foto, kerusakan, dan kehilangan.
- Mendukung pemeliharaan serta audit stok bulanan yang dapat ditelusuri.

## 4. Indikator Keberhasilan

Target berikut perlu divalidasi setelah tersedia baseline operasional:

- 100% unit alat aktif memiliki kode unik, kondisi, dan lokasi.
- 100% alat yang keluar tercatat dalam transaksi peminjaman.
- 100% pinjaman luar area memiliki surat persetujuan sebelum alat diserahkan.
- 100% pengembalian memiliki pemeriksaan kondisi, kelengkapan, dan foto fisik.
- Minimal 95% audit stok bulanan selesai pada periode yang ditentukan.
- Penurunan jumlah pinjaman terlambat dan selisih stok dari bulan ke bulan.

## 5. Pengguna dan Hak Akses

| Peran | Kebutuhan utama | Hak akses utama |
|---|---|---|
| User/Peminjam | Mencari alat, mengajukan pinjaman, memantau token dan kewajiban | Lihat katalog; ajukan, perpanjang, dan kembalikan pinjaman milik sendiri; unggah dokumen |
| Petugas Gudang | Mengelola inventaris dan transaksi harian | CRUD aset dan lokasi; verifikasi serah-terima; inspeksi; audit; pemeliharaan; pengingat |
| Kepala Logistik | Mengontrol penggunaan luar area dan pengecualian | Setujui/tolak pinjaman luar area dan perpanjangan; lihat laporan; review kasus |
| Kepala Lembaga Peminjam | Bertanggung jawab atas kerusakan/kehilangan | Lihat kasus lembaganya; tandatangani/unggah berita acara; berikan keputusan penggantian |
| Administrator Sistem | Mengelola konfigurasi dan akses | Kelola user, role, master data, parameter token, SLA, dan integrasi |
| Auditor/Manajemen | Memantau kepatuhan dan histori | Akses baca laporan, audit trail, dan rekap aset |

Hak akses harus memakai prinsip least privilege dan dapat dibatasi per lembaga/unit kerja.

## 6. Ruang Lingkup

### 6.1 Termasuk dalam MVP

- Master data aset, jenis alat, lokasi, user, lembaga, dan vendor servis.
- Pemberian kode aset dan pencetakan label QR/barcode.
- Penerimaan serta inventarisasi unit alat.
- Katalog, pencarian, dan ketersediaan alat.
- Pengelolaan 10 token pinjaman per user.
- Peminjaman untuk dalam dan luar area Workshop Trowulan.
- Persetujuan Kepala Logistik untuk penggunaan luar area.
- Pengembalian dan pemeriksaan bersama.
- Perpanjangan pinjaman luar area.
- Pencatatan kerusakan, kehilangan, dan berita acara.
- Pemeliharaan, servis berkala, dan riwayat perbaikan.
- Stock opname/audit bulanan.
- Notifikasi, laporan operasional, dan audit trail.

### 6.2 Di luar MVP

- Akuntansi, penyusutan, dan jurnal nilai aset.
- Procurement/pembelian alat baru secara end-to-end.
- Pelacakan GPS atau IoT.
- Pembayaran otomatis penggantian alat.
- Integrasi ke HRIS, ERP, atau sistem tanda tangan digital berlisensi.

## 7. Asumsi Produk

- Satu **jenis alat** dapat memiliki beberapa **unit fisik**; tiap unit memiliki kode aset unik.
- Satu token mengizinkan satu jenis alat dalam satu transaksi aktif. Kuantitas maksimal per jenis default 1 unit dan dapat dikonfigurasi oleh administrator.
- Token berfungsi sebagai kuota pinjaman aktif: token menjadi `Terpakai` ketika alat diserahkan dan kembali `Tersedia` setelah seluruh unit pada item tersebut dikembalikan serta inspeksi selesai.
- Default setiap user adalah 10 token; perubahan kuota harus memiliki alasan dan audit trail.
- Untuk pinjaman dalam area, jatuh tempo otomatis adalah hari Jumat terdekat. Jika peminjaman dilakukan pada hari Jumat setelah batas waktu operasional, sistem memakai Jumat berikutnya. Jam batas dapat dikonfigurasi.
- Surat pinjaman luar area dapat berupa PDF/JPG/PNG dan persetujuan Kepala Logistik tetap direkam di sistem.
- Foto pengembalian wajib memiliki waktu unggah; metadata lokasi bersifat opsional.

Asumsi di atas perlu disahkan oleh owner proses sebelum pengembangan.

## 8. Status Utama

### 8.1 Status unit aset

`Draft` → `Tersedia` → `Direservasi` → `Dipinjam` → `Menunggu Inspeksi` → `Tersedia`

Status alternatif: `Dalam Perawatan`, `Rusak`, `Hilang`, `Tidak Layak Pakai`, dan `Dihapuskan`.

### 8.2 Status permohonan

`Draft`, `Diajukan`, `Menunggu Persetujuan`, `Disetujui`, `Ditolak`, `Siap Diserahkan`, `Aktif`, `Terlambat`, `Menunggu Inspeksi`, `Selesai`, `Dibatalkan`.

### 8.3 Status token

`Tersedia`, `Direservasi`, atau `Terpakai`. Token yang direservasi dilepas jika permohonan ditolak, dibatalkan, atau kedaluwarsa sebelum serah-terima.

## 9. Kebutuhan Fungsional

### FR-01 — Autentikasi dan Otorisasi

- User masuk menggunakan akun terdaftar.
- Sistem menampilkan fitur dan data sesuai role serta lembaga.
- Akun nonaktif tidak dapat membuat transaksi baru.
- Aktivitas sensitif—persetujuan, perubahan kondisi, penyesuaian stok, dan perubahan kuota—dicatat.

### FR-02 — Inventarisasi dan Penerimaan

- Petugas membuat dokumen penerimaan berdasarkan permohonan penyimpanan dari owner/lembaga.
- Sistem mencatat nomor referensi, lembaga pemilik, tanggal masuk, petugas, daftar jenis alat, jumlah, kondisi awal, kelengkapan, foto, dan dokumen pendukung.
- Petugas dapat memasukkan beberapa unit sekaligus, tetapi sistem menghasilkan kode unik untuk setiap unit.
- Sistem mencegah kode aset dan nomor seri duplikat.
- Selisih antara jumlah permohonan dan jumlah diterima harus diberi alasan.

### FR-03 — Identifikasi dan Label Aset

- Format kode aset dapat dikonfigurasi, contoh `TWL-DRL-2026-0001`.
- Label memuat kode, nama alat, QR/barcode, dan opsional lembaga pemilik.
- Pemindaian kode membuka ringkasan unit dan tindakan yang diizinkan.
- Cetak ulang label wajib mencatat user, waktu, dan alasan.

### FR-04 — Lokasi Penyimpanan

- Lokasi mendukung hierarki: area → ruang → rak → tingkat/bin/slot.
- Setiap unit aktif memiliki satu lokasi terakhir.
- Sistem menampilkan kapasitas dan posisi kosong/terisi bila data kapasitas diaktifkan.
- Perpindahan lokasi dicatat sebagai mutasi dengan asal, tujuan, petugas, waktu, dan alasan.

### FR-05 — Katalog dan Ketersediaan

- User dapat mencari berdasarkan nama, kode, kategori, fungsi, ukuran, lokasi, kondisi, dan status.
- Katalog membedakan jumlah total, tersedia, dipinjam, rusak, dan diservis.
- Detail alat menampilkan spesifikasi, aturan penggunaan, kelengkapan standar, dan unit yang tersedia tanpa membuka data pribadi peminjam kepada user umum.

### FR-06 — Token Peminjaman

- User aktif memperoleh default 10 token.
- Dashboard menampilkan token tersedia, direservasi, dan terpakai.
- Satu jenis alat pada pinjaman aktif menggunakan satu token.
- Sistem menolak permohonan bila token tidak cukup.
- Jenis alat yang sama dalam satu permohonan tidak boleh memakai lebih dari satu token akibat baris duplikat; sistem menggabungkannya.
- Token tidak dapat dipindahtangankan antar-user.

### FR-07 — Peminjaman Dalam Area

- User memilih alat, tujuan penggunaan, lokasi pekerjaan, dan tanggal mulai.
- Sistem menentukan tanggal kembali pada Jumat terdekat sesuai konfigurasi.
- Petugas memverifikasi ketersediaan, identitas peminjam, dan kondisi awal.
- Peminjam dan petugas mengonfirmasi serah-terima; setelah itu status alat menjadi `Dipinjam` dan token `Terpakai`.
- Seluruh alat aktif dalam area wajib masuk proses pengembalian pada akhir minggu.

### FR-08 — Peminjaman Luar Area

- User wajib mengisi lokasi penggunaan, tujuan, tanggal keluar, tanggal kembali, dan mengunggah surat permohonan.
- Permohonan masuk ke antrean Kepala Logistik.
- Alat tidak dapat diserahkan sebelum status `Disetujui`.
- Penolakan wajib memiliki alasan.
- Persetujuan merekam pemberi keputusan dan waktu keputusan.
- Petugas memeriksa kondisi awal dan kelengkapan saat serah-terima.

### FR-09 — Perpanjangan

- Sistem menandai pinjaman melewati tanggal kembali sebagai `Terlambat`.
- User atau petugas dapat mengajukan perpanjangan dengan tanggal baru dan alasan.
- Perpanjangan pinjaman luar area memerlukan persetujuan Kepala Logistik.
- Selama menunggu keputusan, tanggal jatuh tempo lama tetap berlaku.
- Riwayat tanggal lama, tanggal baru, alasan, dan keputusan tidak boleh ditimpa.

### FR-10 — Pengingat dan Eskalasi

- Sistem memberi notifikasi sebelum jatuh tempo, pada tanggal jatuh tempo, dan setelah terlambat.
- Pinjaman dalam area menerima pengingat sebelum hari Jumat.
- Pinjaman luar area menerima pengingat sesuai tanggal yang disetujui.
- Petugas dapat mencatat hasil konfirmasi: `Masih Digunakan`, `Akan Dikembalikan`, `Mengajukan Perpanjangan`, atau `Tidak Dapat Dihubungi`.
- Eskalasi berulang dan penerimanya dapat dikonfigurasi.

### FR-11 — Pengembalian dan Inspeksi

- Pengembalian dapat diawali user, tetapi diselesaikan oleh petugas bersama peminjam.
- Sistem merekam tanggal/waktu aktual, unit yang kembali, kondisi, kelengkapan, catatan, dan foto fisik.
- Checklist kelengkapan berasal dari standar jenis alat dan dapat ditambah catatan.
- Pengembalian parsial diperbolehkan per unit; token baru dilepas setelah seluruh unit untuk jenis terkait selesai diperiksa.
- Hasil normal mengubah aset menjadi `Tersedia` dan transaksi menjadi `Selesai`.
- Ketidaksesuaian mengarahkan unit ke alur kerusakan atau kehilangan.

### FR-12 — Kerusakan

- Petugas mencatat kategori, tingkat kerusakan, kronologi, foto, estimasi dampak, dan pihak terkait.
- Berita Acara Kerusakan yang ditandatangani Kepala Lembaga Peminjam wajib diunggah.
- Unit berubah menjadi `Rusak` atau `Dalam Perawatan` dan tidak dapat dipinjam.
- Lembaga peminjam mencatat hasil review: `Perbaiki`, `Beli Pengganti`, `Tidak Mengganti`, atau `Menunggu Keputusan`, beserta alasan.
- Kasus baru dapat ditutup setelah dokumen dan keputusan lengkap.

### FR-13 — Kehilangan

- Petugas mencatat unit hilang, kronologi, waktu/lokasi terakhir, peminjam, dan bukti.
- Berita Acara Kehilangan yang ditandatangani Kepala Lembaga Peminjam wajib diunggah.
- Unit berstatus `Hilang` dan tidak tersedia untuk peminjaman.
- Sistem melacak kewajiban penggantian user: `Belum Diproses`, `Dalam Proses`, `Sudah Diganti`, atau `Dibebaskan dengan Persetujuan`.
- Jika diganti, unit pengganti didaftarkan sebagai aset baru dan ditautkan ke kasus kehilangan.

### FR-14 — Pemeliharaan dan Servis

- Petugas membuat jadwal pembersihan, pemeriksaan rutin, kalibrasi, atau servis berdasarkan interval tanggal/jam pakai.
- Sistem menampilkan pekerjaan yang akan jatuh tempo dan terlambat.
- Unit dalam servis tidak dapat dipinjam.
- Riwayat mencatat tindakan, hasil, biaya opsional, vendor, spare part, foto, dan tanggal servis berikutnya.
- Kerusakan kritis dapat langsung membuat work order perbaikan.

### FR-15 — Audit Stok Bulanan

- Petugas membuat sesi audit berdasarkan lokasi/kategori dengan snapshot stok pada waktu mulai.
- Pemindaian QR/barcode menandai unit sebagai ditemukan dan merekam kondisi/lokasi aktual.
- Sistem menghasilkan selisih: `Sesuai`, `Tidak Ditemukan`, `Lokasi Berbeda`, `Kondisi Berbeda`, atau `Tidak Terdaftar`.
- Penyesuaian hasil audit memerlukan alasan dan persetujuan sesuai otorisasi.
- Audit menyimpan petugas, cakupan, progres, bukti, hasil rekonsiliasi, dan waktu selesai.

### FR-16 — Notifikasi

- Kanal MVP: notifikasi dalam aplikasi dan email bila tersedia.
- Event minimal: permohonan diajukan, disetujui/ditolak, siap diambil, jatuh tempo, terlambat, perpanjangan diputuskan, servis jatuh tempo, dan audit belum selesai.
- Sistem menyimpan status terkirim/dibaca dan menyediakan tautan ke objek terkait.

### FR-17 — Laporan

- Ringkasan aset per kategori, lokasi, kondisi, status, dan lembaga pemilik.
- Ketersediaan dan utilisasi alat.
- Pinjaman aktif, jatuh tempo, terlambat, serta histori per user/lembaga.
- Pemakaian token per user.
- Kerusakan, kehilangan, penggantian, dan biaya servis bila diisi.
- Kepatuhan pengembalian Jumat dan kelengkapan dokumen.
- Hasil serta selisih audit bulanan.
- Ekspor CSV/XLSX dan PDF untuk laporan formal; filter yang aktif dicantumkan pada hasil ekspor.

### FR-18 — Audit Trail

- Sistem mencatat pelaku, waktu, aksi, objek, nilai sebelum/sesudah, dan sumber perangkat/IP bila tersedia.
- Audit trail tidak dapat diedit oleh user operasional.
- Dokumen dan foto memiliki versi atau histori penggantian.

## 10. Alur Utama

### 10.1 Penerimaan alat

1. Petugas membuat penerimaan dari permohonan penyimpanan.
2. Petugas menghitung dan mencocokkan jumlah.
3. Petugas mengisi kondisi awal, kelengkapan, foto, dan lokasi.
4. Sistem membuat kode unit dan label.
5. Petugas menempel/memindai label untuk verifikasi.
6. Unit diaktifkan dengan status `Tersedia`.

### 10.2 Pinjaman dalam area

1. User memilih jenis alat; sistem mengecek stok dan token.
2. User mengajukan tujuan penggunaan.
3. Sistem menetapkan Jumat sebagai jatuh tempo.
4. Petugas memilih unit dan melakukan pemeriksaan awal.
5. Kedua pihak mengonfirmasi serah-terima.
6. Sistem menggunakan token dan mengaktifkan pinjaman.
7. Sistem mengirim pengingat sebelum Jumat.

### 10.3 Pinjaman luar area

1. User mengisi periode dan mengunggah surat.
2. Sistem memvalidasi stok, token, dan kelengkapan.
3. Kepala Logistik menyetujui atau menolak.
4. Petugas melakukan pemeriksaan awal dan serah-terima.
5. Sistem memantau tenggat serta mengirim pengingat.
6. Jika masih diperlukan, user mengajukan perpanjangan untuk disetujui.

### 10.4 Pengembalian

1. Petugas memindai transaksi/unit.
2. User dan petugas memeriksa kondisi serta checklist kelengkapan.
3. Petugas mengunggah foto fisik dan menyimpan laporan pemeriksaan.
4. Jika sesuai, unit tersedia kembali dan token dilepas.
5. Jika rusak/hilang, sistem membuka kasus dan meminta berita acara.

## 11. Model Data Inti

| Entitas | Data penting |
|---|---|
| User | ID, nama, NIK, lembaga, kontak, role, status, kuota token |
| Lembaga | ID, nama, kepala lembaga, kontak |
| Jenis alat | Nama, kategori, fungsi, ukuran/spesifikasi, kelengkapan standar, aturan servis |
| Unit aset | Kode unik, jenis, serial, owner, tanggal masuk, kondisi, status, lokasi, foto |
| Lokasi | Area, ruang, rak, bin/slot, kapasitas |
| Penerimaan | Referensi, owner peminta, tanggal, item, jumlah diminta/diterima, bukti |
| Permohonan pinjam | Peminjam, area penggunaan, tujuan, periode, surat, status persetujuan |
| Item pinjaman | Jenis alat, unit aktual, jumlah, token, kondisi keluar/kembali |
| Inspeksi | Checklist, kondisi, kelengkapan, foto, dua pihak, waktu |
| Perpanjangan | Tenggat lama/baru, alasan, pemohon, keputusan |
| Kasus kerusakan/kehilangan | Unit, kronologi, bukti, berita acara, keputusan, penggantian |
| Work order | Jenis pemeliharaan, jadwal, tindakan, vendor, hasil, biaya |
| Audit stok | Periode, cakupan, snapshot, hasil scan, selisih, rekonsiliasi |
| Notifikasi | Penerima, event, kanal, status kirim/baca |
| Audit log | Pelaku, aksi, objek, sebelum/sesudah, waktu |

## 12. Aturan Validasi Kritis

- Unit tidak boleh aktif pada lebih dari satu pinjaman pada waktu yang sama.
- Unit `Rusak`, `Hilang`, `Dalam Perawatan`, `Tidak Layak Pakai`, atau `Dihapuskan` tidak dapat diserahkan.
- Peminjaman tidak dapat aktif tanpa token tersedia.
- Peminjaman luar area tidak dapat diserahkan tanpa surat dan persetujuan Kepala Logistik.
- Tanggal kembali tidak boleh sebelum tanggal keluar.
- Pengembalian tidak dapat selesai tanpa inspeksi, checklist kelengkapan, dan minimal satu foto fisik.
- Kasus rusak/hilang tidak dapat ditutup tanpa berita acara yang diwajibkan.
- Semua override harus meminta alasan dan dicatat pada audit trail.

## 13. Kebutuhan Non-Fungsional

- **Keamanan:** TLS, password di-hash, role-based access control, proteksi file privat, sesi kedaluwarsa, dan rate limiting.
- **Kinerja:** 95% halaman operasional terbuka ≤ 2 detik pada koneksi internal normal; pencarian katalog ≤ 2 detik untuk 100.000 unit.
- **Ketersediaan:** target 99,5% per bulan di luar pemeliharaan terjadwal.
- **Integritas:** transaksi serah-terima, token, dan status aset harus atomik agar tidak terjadi double booking.
- **Backup:** backup harian, retensi minimal 30 hari, dan uji pemulihan berkala.
- **Privasi:** data peminjam hanya terlihat bagi pihak yang berwenang; ekspor mengacu pada hak akses.
- **Aksesibilitas:** target WCAG 2.2 AA untuk antarmuka utama.
- **Perangkat:** optimal untuk desktop gudang dan mobile saat scan/inspeksi.
- **Waktu:** seluruh timestamp disimpan konsisten dan ditampilkan dalam zona Asia/Jakarta.

## 14. Acceptance Criteria MVP

1. Petugas dapat mendaftarkan unit, mencetak label unik, menentukan lokasi, dan melihat histori perubahan.
2. User dengan 10 token dapat meminjam maksimal 10 jenis alat secara bersamaan; permohonan ke-11 ditolak dengan alasan jelas.
3. Token kembali tersedia hanya setelah item selesai dikembalikan dan diperiksa.
4. Pinjaman dalam area otomatis memiliki tenggat Jumat yang benar.
5. Pinjaman luar area tidak dapat diserahkan sebelum surat terunggah dan Kepala Logistik menyetujui.
6. Sistem menandai transaksi terlambat dan merekam tindak lanjut petugas.
7. Pengembalian mewajibkan kondisi, kelengkapan, foto, user, dan petugas pemeriksa.
8. Temuan rusak/hilang mengubah status alat, menutup ketersediaan, serta membuka alur berita acara.
9. Petugas dapat menjadwalkan servis dan menyelesaikan audit stok bulanan dengan laporan selisih.
10. Semua keputusan dan perubahan kritis muncul pada audit trail dan laporan dapat diekspor.

## 15. Tahapan Implementasi yang Disarankan

- **Fase 1 — Fondasi:** user/role, master data, inventarisasi, label, lokasi, katalog.
- **Fase 2 — Sirkulasi:** token, pinjaman dalam/luar area, approval, serah-terima, pengembalian, notifikasi.
- **Fase 3 — Kontrol aset:** kerusakan, kehilangan, maintenance, audit bulanan, laporan.
- **Fase 4 — Optimasi:** integrasi, analitik utilisasi, automasi notifikasi lanjutan, dan peningkatan mobile scanning.

## 16. Pertanyaan yang Harus Diputuskan Stakeholder

1. Apakah satu jenis alat boleh dipinjam lebih dari satu unit dengan tetap memakai satu token?
2. Apakah token dikembalikan setelah alat kembali (kuota aktif) atau habis permanen selama periode tertentu?
3. Apakah pinjaman dalam area memerlukan approval sebelum serah-terima?
4. Apa jam batas hari Jumat dan bagaimana aturan hari libur?
5. Berapa lama reservasi stok berlaku sebelum permohonan otomatis dibatalkan?
6. Siapa yang menyetujui perubahan kuota token dan penyesuaian hasil audit?
7. Apakah berita acara memerlukan tanda tangan digital di dalam aplikasi atau cukup unggah dokumen bertanda tangan?
8. Kanal notifikasi apa yang wajib: aplikasi, email, WhatsApp, atau kombinasi?
9. Berapa retensi dokumen, foto, dan audit trail?

