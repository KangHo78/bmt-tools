# Product Requirements Document — Tampilan dan Pengalaman Pengguna

## Tools Asset Management System

| Atribut | Nilai |
|---|---|
| Versi | 1.0 |
| Status | Draft untuk review stakeholder |
| Platform | Web responsif, desktop-first untuk administrasi dan mobile-first untuk scan/inspeksi |
| Bahasa | Bahasa Indonesia |
| Arah desain | Industrial control room: tegas, padat, cepat dipindai, dan berorientasi status |

## 1. Tujuan Tampilan

Antarmuka harus membantu petugas dan peminjam menjawab empat pertanyaan tanpa mencari lama:

1. Alat apa yang tersedia dan berada di mana?
2. Siapa yang memegang alat dan kapan harus kembali?
3. Apakah transaksi atau dokumennya sudah lengkap?
4. Tindakan apa yang harus dilakukan sekarang?

Desain mengutamakan kecepatan kerja, pencegahan kesalahan, keterbacaan status, serta bukti visual saat serah-terima.

## 2. Prinsip Pengalaman Pengguna

- **Status sebelum dekorasi:** kondisi alat, tenggat, dan tindakan selalu paling menonjol.
- **Scan adalah jalan pintas utama:** tombol scan tersedia konsisten pada desktop dan mobile.
- **Progressive disclosure:** informasi ringkas dahulu, detail teknis dan histori saat dibutuhkan.
- **Satu layar, satu keputusan utama:** setiap halaman memiliki satu primary action yang jelas.
- **Pencegahan kesalahan:** aturan token, dokumen, dan kelengkapan divalidasi sebelum tahap akhir.
- **Bukti tidak tersembunyi:** foto, checklist, surat, dan berita acara mudah ditemukan.
- **Bekerja pada kondisi gudang:** target sentuh besar, kontras tinggi, dan teks ringkas.

## 3. Konsep Visual

### 3.1 Arah estetika

Tampilan mengambil karakter papan kontrol bengkel: bidang netral hangat, garis grid presisi, label teknis, dan aksen keselamatan. Hasilnya profesional dan khas operasional, bukan dashboard korporat generik.

### 3.2 Design tokens awal

| Token | Nilai rekomendasi | Penggunaan |
|---|---|---|
| Canvas | `#F2F0E9` | Latar utama seperti kertas kerja teknis |
| Surface | `#FFFEFA` | Panel, modal, kartu |
| Ink | `#17201D` | Teks utama |
| Muted | `#64706A` | Metadata dan teks sekunder |
| Line | `#CBD0C8` | Border dan pembatas |
| Safety Amber | `#F2A900` | CTA, perhatian, mendekati jatuh tempo |
| Signal Red | `#C73A2A` | Rusak, hilang, terlambat |
| Machine Green | `#28735A` | Tersedia, selesai, normal |
| Service Blue | `#276C91` | Perawatan, informasi |

Warna tidak boleh menjadi satu-satunya pembeda; selalu pasangkan dengan ikon dan label teks.

### 3.3 Tipografi

- Judul/display: **Barlow Condensed** atau font condensed berkarakter teknis.
- Isi/UI: **IBM Plex Sans** untuk keterbacaan pada tabel dan formulir.
- Kode aset/angka: **IBM Plex Mono** agar hasil scan, token, dan ID mudah dibandingkan.
- Fallback harus disediakan jika webfont gagal dimuat.

### 3.4 Bentuk dan motion

- Sudut panel 4–8 px; hindari kartu terlalu bulat.
- Border 1 px dan bayangan pendek untuk memberi kesan perangkat fisik.
- Ikon bergaya outline konsisten.
- Animasi 120–220 ms untuk transisi status, drawer, dan feedback scan.
- Hormati preferensi `prefers-reduced-motion`.

## 4. Struktur Navigasi

### 4.1 Navigasi desktop

Sidebar kiri yang dapat diperkecil:

- Ringkasan
- Katalog Alat
- Peminjaman
- Pengembalian
- Inventaris
- Lokasi
- Pemeliharaan
- Audit Stok
- Kasus
- Laporan
- Administrasi

Header berisi pencarian global, tombol scan, notifikasi, lokasi kerja aktif, dan menu akun.

### 4.2 Navigasi mobile

Bottom navigation maksimal lima tujuan:

- Beranda
- Katalog
- Scan
- Pinjaman
- Akun

Fitur petugas tambahan dibuka dari menu `Lainnya`. Tombol `Scan` berada di tengah dan paling mudah dijangkau.

### 4.3 Pencarian global

Pencarian menerima nama alat, kode aset, nomor transaksi, nama peminjam, dan lokasi. Hasil dikelompokkan per jenis objek dan dapat dioperasikan dengan keyboard.

## 5. Dashboard Berdasarkan Role

### 5.1 Dashboard User/Peminjam

Urutan konten:

1. **Token meter:** `7 dari 10 token tersedia` dengan rincian token terpakai.
2. **Kewajiban terdekat:** alat yang harus kembali paling cepat, dengan countdown berbasis tanggal.
3. **Aksi cepat:** Cari Alat, Ajukan Pinjaman, Ajukan Pengembalian.
4. **Pinjaman aktif:** ringkasan unit, area penggunaan, tenggat, status dokumen.
5. **Permohonan terbaru:** status approval dan alasan penolakan bila ada.

### 5.2 Dashboard Petugas Gudang

Bagian atas berupa `shift board`:

- Serah-terima hari ini.
- Pengembalian menunggu inspeksi.
- Pinjaman jatuh tempo Jumat ini.
- Pinjaman luar area terlambat.
- Servis dan audit yang perlu tindakan.

Di bawahnya terdapat antrean kerja prioritas, ketersediaan per kategori, dan aktivitas terakhir. Tiap kartu ringkasan langsung membuka daftar yang telah terfilter.

### 5.3 Dashboard Kepala Logistik

- Approval pinjaman luar area.
- Approval perpanjangan.
- Pinjaman terlambat per lembaga.
- Kasus rusak/hilang yang belum selesai.
- Ringkasan utilisasi dan kepatuhan bulanan.

## 6. Spesifikasi Layar

### UI-01 — Login

- Logo/nama sistem, input identitas dan password, tampil/sembunyikan password, lupa password.
- Pesan error tidak mengungkap apakah akun terdaftar.
- Informasi bantuan kontak admin.

### UI-02 — Katalog Alat

- Search bar dominan dengan tombol scan.
- Filter: kategori, fungsi, ukuran, lokasi, status ketersediaan, dan kondisi.
- Toggle `Grid` untuk user dan `Tabel` untuk petugas.
- Kartu katalog menampilkan foto, nama, kode jenis, stok tersedia/total, lokasi utama, dan aturan singkat.
- Empty state membedakan tidak ada data dengan filter tidak menemukan hasil.

### UI-03 — Detail Jenis dan Unit Alat

- Header: nama, kategori, badge ketersediaan, dan CTA `Pinjam Alat`.
- Galeri foto dan spesifikasi.
- Diagram lokasi singkat: `Tool Room A / Rak 03 / Slot B`.
- Tab: Ringkasan, Unit, Kelengkapan, Pemeliharaan, Histori.
- Untuk petugas, tiap unit mempunyai quick action: pindah lokasi, inspeksi, servis, cetak label.

### UI-04 — Form Permohonan Pinjaman

Gunakan stepper empat tahap:

1. **Pilih alat:** keranjang dikelompokkan per jenis dan menampilkan token yang akan digunakan.
2. **Pilih penggunaan:** Dalam Area atau Luar Area.
3. **Isi detail:** tujuan, lokasi, tanggal; untuk luar area tampilkan upload surat.
4. **Tinjau:** rangkuman alat, token tersisa, tenggat, dokumen, dan pernyataan tanggung jawab.

Validasi tampil inline. Tombol kirim nonaktif disertai alasan bila persyaratan belum lengkap.

### UI-05 — Detail Peminjaman

- Nomor transaksi monospace, status, peminjam, area, dan timeline.
- Panel tenggat memiliki hierarki visual tinggi; terlambat menggunakan merah, ikon, dan teks `Terlambat X hari`.
- Daftar alat memperlihatkan unit aktual, kondisi keluar, foto, dan status kembali.
- Panel dokumen menampilkan surat, approval, inspeksi, dan berita acara.
- Action bar bersifat sticky dan berubah sesuai role/status: Setujui, Tolak, Serahkan, Perpanjang, Ingatkan, atau Proses Kembali.

### UI-06 — Approval Kepala Logistik

- Tampilan split-view desktop: antrean di kiri, detail permohonan di kanan.
- Detail menonjolkan tujuan, lokasi luar area, durasi, histori user, token, ketersediaan, dan preview surat.
- `Tolak` meminta alasan wajib; `Setujui` meminta konfirmasi periode.
- Mobile menggunakan halaman daftar lalu detail penuh.

### UI-07 — Serah-Terima

- Mode fokus tanpa navigasi yang ramai.
- Langkah: scan unit → cocokkan unit → checklist kondisi/kelengkapan → foto → konfirmasi kedua pihak.
- Setiap scan memberi feedback bunyi opsional, getar di perangkat pendukung, dan status visual.
- Unit salah, duplikat, atau tidak tersedia menghasilkan error yang menyebut tindakan koreksi.
- Ringkasan akhir menampilkan token yang berubah dan tombol unduh bukti.

### UI-08 — Pengembalian dan Inspeksi

- Dibuka lewat scan kode transaksi atau kode unit.
- Daftar unit memakai status `Belum Dicek`, `Sesuai`, `Rusak`, `Tidak Lengkap`, atau `Hilang`.
- Checklist dapat dituntaskan satu tangan pada mobile; target sentuh minimal 44×44 px.
- Kamera mendukung beberapa foto, preview, hapus sebelum kirim, dan indikator upload.
- Bila rusak/hilang dipilih, UI membuka kolom kronologi dan alur berita acara tanpa menghapus progres inspeksi.
- Tombol `Selesaikan Pengembalian` menampilkan pemeriksaan akhir atas data wajib.

### UI-09 — Inventaris dan Penerimaan

- Tabel padat dengan kolom yang dapat dipilih dan sticky header.
- Bulk intake memakai template baris: jenis, jumlah, serial, kondisi, owner, lokasi.
- Setelah simpan, UI menampilkan batch kode serta opsi cetak label.
- Detail unit memiliki `asset passport`: identitas, status kini, lokasi, histori peminjaman, servis, foto, dan audit trail.

### UI-10 — Peta Lokasi Penyimpanan

- Hierarki area/ruang/rak di kiri dan grid slot di kanan.
- Slot memakai label `Terisi`, `Kosong`, atau `Melebihi Kapasitas` dengan pola/ikon selain warna.
- Drag-and-drop hanya untuk user berwenang dan selalu memunculkan konfirmasi mutasi.
- Alternatif form tersedia untuk aksesibilitas dan perangkat sentuh.

### UI-11 — Pemeliharaan

- Kalender dan daftar pekerjaan dengan filter `Jatuh Tempo`, `Terlambat`, `Selesai`.
- Work order menampilkan unit, tindakan, teknisi/vendor, foto sebelum/sesudah, biaya opsional, dan jadwal berikutnya.
- Status alat selalu terlihat dan perubahan status dijelaskan sebelum penyimpanan.

### UI-12 — Audit Stok

- Halaman persiapan: pilih cakupan, petugas, dan jadwal.
- Mode audit mobile berfokus pada scanner dan progres besar, contoh `148 / 200 unit`.
- Setelah scan tampil nama, lokasi seharusnya, lokasi aktual, dan kondisi.
- Layar rekonsiliasi mengelompokkan selisih menurut tindakan, bukan hanya jenis error.
- Finalisasi membutuhkan konfirmasi jumlah selisih dan catatan reviewer.

### UI-13 — Kasus Kerusakan/Kehilangan

- Kanban opsional per tahap dan tabel untuk ekspor/administrasi.
- Detail kasus menyatukan kronologi, bukti, berita acara, penanggung jawab, keputusan, dan unit pengganti.
- Checklist dokumen menunjukkan apa yang masih kurang.
- Status kritis tidak dapat ditutup tanpa field wajib; UI menjelaskan kekurangannya.

### UI-14 — Laporan

- Filter persisten pada sisi kiri desktop dan bottom sheet di mobile.
- KPI di atas, visual tren bila relevan, lalu tabel sumber yang dapat ditelusuri.
- Pengguna dapat membuka data pembentuk angka (`drill-down`).
- Tombol ekspor menyebut format dan jumlah baris; proses besar menampilkan status pekerjaan.

### UI-15 — Notifikasi dan Pusat Tugas

- Notifikasi dikelompokkan `Perlu Tindakan`, `Informasi`, dan `Selesai`.
- Item memuat objek, alasan, waktu, dan CTA langsung.
- Menandai dibaca tidak sama dengan menyelesaikan tugas.

### UI-16 — Administrasi

- User dan role, lembaga, master jenis alat, kategori, lokasi, vendor, template checklist, kuota token, hari/jam tenggat, serta template notifikasi.
- Perubahan konfigurasi kritis menampilkan dampak dan meminta alasan.

## 7. Komponen Inti

| Komponen | Kebutuhan |
|---|---|
| Status badge | Ikon + label + warna; ukuran konsisten; tooltip untuk definisi |
| Token meter | Angka eksplisit tersedia/total; rincian saat dipilih; bukan hanya progress bar |
| Asset row/card | Foto, nama, kode, lokasi, kondisi, ketersediaan, quick action |
| Deadline panel | Tanggal absolut, waktu relatif, area penggunaan, tingkat urgensi |
| Document uploader | Jenis/ukuran file, progress, preview, gagal/coba lagi, versi |
| Photo capture | Kamera/gallery, preview, kompresi, caption opsional, status upload |
| Inspection checklist | Kelengkapan standar, kondisi, catatan, siapa memeriksa |
| Timeline | Waktu, aktor, event, dokumen terkait; urutan terbaru/terlama dapat dipilih |
| Data table | Sort, filter, pagination, sticky header, pilihan kolom, bulk action terbatas |
| Scanner overlay | Frame jelas, bantuan pencahayaan, input manual sebagai fallback |
| Confirmation dialog | Menjelaskan akibat dan objek; destructive action tidak memakai copy ambigu |
| Toast/banner | Sukses singkat; error persisten sampai dipahami atau ditangani |

## 8. Matriks Status Tampilan

| Status | Label tampilan | Ikon | Warna/aksen | CTA utama |
|---|---|---|---|---|
| Tersedia | Tersedia | Check circle | Machine Green | Pinjam |
| Direservasi | Direservasi | Clock | Safety Amber | Lihat Permohonan |
| Dipinjam | Dipinjam | Arrow out | Service Blue | Lihat Tenggat |
| Menunggu inspeksi | Perlu Diperiksa | Clipboard | Safety Amber | Mulai Inspeksi |
| Terlambat | Terlambat X hari | Alert triangle | Signal Red | Ingatkan/Proses |
| Dalam perawatan | Dalam Perawatan | Wrench | Service Blue | Lihat Work Order |
| Rusak | Rusak | Broken tool | Signal Red | Buat/Review Kasus |
| Hilang | Hilang | Search alert | Signal Red + pola | Lihat Pertanggungjawaban |
| Selesai | Selesai | Check | Machine Green | Lihat Bukti |

## 9. State yang Wajib Dirancang

Setiap layar harus memiliki desain untuk:

- Loading awal dan loading parsial.
- Empty state pertama kali.
- Tidak ada hasil akibat filter.
- Error koneksi dan tombol coba lagi.
- Tidak punya hak akses.
- Data berubah oleh user lain.
- Upload berjalan, gagal, dan berhasil.
- Kamera/izin kamera tidak tersedia.
- Offline saat inspeksi; MVP minimal menyimpan draft lokal dan mencegah klaim bahwa data sudah terkirim.

## 10. Responsivitas

- **≥ 1280 px:** sidebar penuh, tabel padat, split view, detail drawer.
- **768–1279 px:** sidebar ringkas, kolom prioritas, form maksimal dua kolom.
- **< 768 px:** bottom navigation, kartu/list, form satu kolom, sticky action bar.
- Tabel kompleks di mobile berubah menjadi kartu; jangan mengandalkan scroll horizontal untuk proses inti.
- Kamera, scan, inspeksi, dan upload foto dioptimalkan untuk orientasi portrait.

## 11. Aksesibilitas

- Kontras teks dan komponen memenuhi WCAG 2.2 AA.
- Semua fungsi desktop dapat digunakan dengan keyboard.
- Focus ring jelas dan tidak dihilangkan.
- Input memiliki label permanen, petunjuk, dan error yang terhubung secara programatis.
- Dialog mengunci fokus dengan benar dan dapat ditutup sesuai konteks.
- Tabel memiliki header semantik; status diumumkan oleh screen reader.
- Target sentuh minimal 44×44 px.
- Foto wajib memiliki keterangan konteks bila informasi tidak tercakup dalam checklist.

## 12. Pedoman Microcopy

- Gunakan kata kerja spesifik: `Ajukan Pinjaman`, `Setujui sampai 28 Agustus`, `Selesaikan Inspeksi`.
- Hindari `OK`, `Submit`, atau `Proses` tanpa objek.
- Tampilkan tanggal absolut dan relatif: `Jumat, 21 Agustus 2026 · 2 hari lagi`.
- Error menjelaskan sebab dan perbaikan: `Token tidak cukup. Kembalikan 1 jenis alat aktif atau hapus item dari permohonan.`
- Konfirmasi tindakan kritis menyebut kode alat/transaksi.
- Gunakan istilah konsisten: `alat`, `unit aset`, `jenis alat`, `peminjaman`, `pengembalian`, dan `inspeksi`.

## 13. Wireframe Tekstual Kunci

### 13.1 Dashboard petugas — desktop

```text
┌──────────────┬──────────────────────────────────────────────────────────┐
│ NAVIGASI     │ Cari alat/transaksi...          [SCAN] [Notif] [Akun]   │
│              ├──────────────────────────────────────────────────────────┤
│ Ringkasan    │ SHIFT BOARD · RABU, 19 AGUSTUS                           │
│ Katalog      │ [8 Serah Terima] [5 Inspeksi] [12 Jumat Ini] [3 Telat] │
│ Peminjaman   ├───────────────────────────────────┬──────────────────────┤
│ Pengembalian │ PRIORITAS HARI INI                │ KONDISI STOK         │
│ Inventaris   │ 09:00 TRX-1042 · Ambil alat      │ 82% tersedia         │
│ Pemeliharaan │ 10:30 TRX-1031 · Inspeksi        │ 11 servis · 2 rusak  │
│ Audit        │ ...                               │                      │
└──────────────┴───────────────────────────────────┴──────────────────────┘
```

### 13.2 Inspeksi pengembalian — mobile

```text
┌─────────────────────────────┐
│ ← Pengembalian  TRX-1042    │
│ 2 dari 3 unit diperiksa     │
├─────────────────────────────┤
│ [ Foto Bor Tangan ]         │
│ TWL-DRL-2026-0001           │
│                             │
│ Kondisi                     │
│ [ Sesuai ] [ Rusak ]        │
│                             │
│ Kelengkapan                 │
│ ☑ Baterai  ☑ Charger        │
│ ☑ Kotak    ☐ Buku panduan   │
│                             │
│ [ + Ambil Foto ]            │
├─────────────────────────────┤
│ [Simpan & Unit Berikutnya]  │
└─────────────────────────────┘
```

## 14. Acceptance Criteria Tampilan

1. User dapat mengetahui token tersedia dan pinjaman terdekat dari dashboard tanpa membuka halaman lain.
2. Petugas dapat memulai scan dari setiap halaman operasional maksimal satu tindakan.
3. Status alat, transaksi, dan dokumen dapat dikenali tanpa mengandalkan warna saja.
4. Alur pinjaman menampilkan dampak token dan persyaratan area sebelum dikirim.
5. Approval luar area menampilkan surat, durasi, stok, token, dan histori relevan pada satu konteks keputusan.
6. Serah-terima dan pengembalian dapat diselesaikan pada mobile tanpa scroll horizontal.
7. UI tidak mengizinkan finalisasi pengembalian sebelum kondisi, kelengkapan, foto, dan pemeriksa lengkap.
8. Semua halaman penting memiliki loading, empty, error, success, dan unauthorized state.
9. Navigasi dan form inti dapat digunakan dengan keyboard serta memenuhi target WCAG 2.2 AA.
10. Pada pengujian usability, minimal 90% petugas dapat menemukan unit, menyerahkan, dan memproses pengembalian tanpa bantuan moderator.

## 15. Deliverables Desain

- Sitemap dan role-to-screen matrix.
- User flow untuk inventarisasi, pinjam dalam area, pinjam luar area, perpanjangan, kembali normal, rusak, hilang, maintenance, dan audit.
- Low-fidelity wireframe seluruh layar inti.
- Design system: tokens, typography, icons, components, form, table, status, dan states.
- High-fidelity desktop dan mobile untuk alur kritis.
- Prototype interaktif untuk pengujian usability.
- Spesifikasi handoff termasuk responsivitas, validasi, loading/error, dan aturan aksesibilitas.

## 16. Pertanyaan Desain untuk Validasi

1. Apakah petugas memakai scanner handheld, kamera ponsel, atau keduanya?
2. Apakah koneksi di tool room stabil sehingga perlu mode offline penuh atau cukup draft lokal?
3. Apakah organisasi sudah memiliki brand guideline, logo, warna, dan font resmi?
4. Apakah user lapangan memerlukan dukungan bahasa selain Indonesia?
5. Peran mana yang paling sering memakai tablet atau ponsel?
6. Apakah foto memerlukan cap waktu/lokasi yang terlihat pada gambar?
7. Apakah bukti serah-terima memerlukan tanda tangan layar dari kedua pihak?

