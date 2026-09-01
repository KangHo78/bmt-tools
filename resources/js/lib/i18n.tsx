import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren,
} from "react";

export type Locale = "id" | "en";

const STORAGE_KEY = "tams.locale";

type Copy = readonly [source: string, id: string, en: string];

const copy: Copy[] = [
    // Navigation and shared actions
    ["Ringkasan", "Ringkasan", "Overview"],
    ["Dashboard", "Ringkasan", "Overview"],
    ["Katalog Alat", "Katalog Alat", "Tool Catalog"],
    ["Peminjaman", "Peminjaman", "Lending"],
    ["Pengembalian", "Pengembalian", "Returns"],
    ["Inventaris", "Inventaris", "Inventory"],
    ["Lokasi", "Lokasi", "Locations"],
    ["Pemeliharaan", "Pemeliharaan", "Maintenance"],
    ["Audit Stok", "Audit Stok", "Stock Audits"],
    ["Approval", "Persetujuan", "Approvals"],
    ["Kasus", "Kasus", "Cases"],
    ["Laporan", "Laporan", "Reports"],
    ["Administrasi", "Administrasi", "Administration"],
    ["Notifikasi", "Notifikasi", "Notifications"],
    [
        "Cari alat, unit, atau transaksi...",
        "Cari alat, unit, atau transaksi...",
        "Search tools, units, or transactions...",
    ],
    ["Scan", "Pindai", "Scan"],
    ["Cari", "Cari", "Search"],
    ["Cari Kode", "Cari Kode", "Find Code"],
    [
        "Ketik minimal 2 karakter...",
        "Ketik minimal 2 karakter...",
        "Enter at least 2 characters...",
    ],
    [
        "Tidak ada hasil ditemukan.",
        "Tidak ada hasil ditemukan.",
        "No results found.",
    ],
    ["Pindai Label", "Pindai Label", "Scan Label"],
    ["Scanner Gateway", "Gerbang Pemindai", "Scanner Gateway"],
    ["Pilihan bahasa", "Pilihan bahasa", "Language selection"],
    ["Bahasa Indonesia", "Bahasa Indonesia", "Indonesian"],
    ["English", "Bahasa Inggris", "English"],
    ["Input kode manual", "Masukkan kode secara manual", "Enter code manually"],
    [
        "Kode tidak ditemukan. Periksa label dan coba lagi.",
        "Kode tidak ditemukan. Periksa label dan coba lagi.",
        "Code not found. Check the label and try again.",
    ],
    ["Buka menu", "Buka menu", "Open menu"],
    ["Tutup menu", "Tutup menu", "Close menu"],
    ["Tutup navigasi", "Tutup navigasi", "Close navigation"],
    [
        "Kembali ke aplikasi utama",
        "Kembali ke aplikasi utama",
        "Return to the main application",
    ],
    ["Lihat semua", "Lihat semua", "View all"],
    ["Kembali", "Kembali", "Back"],
    ["Navigasi halaman", "Navigasi halaman", "Page navigation"],
    ["Halaman sebelumnya", "Halaman sebelumnya", "Previous page"],
    ["Halaman berikutnya", "Halaman berikutnya", "Next page"],
    ["Batal", "Batal", "Cancel"],
    ["Simpan", "Simpan", "Save"],
    ["Hapus", "Hapus", "Delete"],
    ["Ubah", "Ubah", "Edit"],
    ["Cetak", "Cetak", "Print"],
    ["Mulai", "Mulai", "Start"],
    ["Lanjutkan", "Lanjutkan", "Continue"],
    ["Finalisasi", "Finalisasi", "Finalize"],
    ["Terapkan", "Terapkan", "Apply"],
    ["Periksa", "Periksa", "Review"],
    ["Setujui", "Setujui", "Approve"],
    ["Tolak", "Tolak", "Reject"],
    ["Pindah", "Pindah", "Move"],
    ["Masuk", "Masuk", "Sign in"],

    // Roles, states, and common nouns
    ["Peminjam", "Peminjam", "Borrower"],
    ["Petugas", "Petugas", "Officer"],
    ["Admin Tools", "Admin Peralatan", "Tools Administrator"],
    ["Kepala Logistik", "Kepala Logistik", "Head of Logistics"],
    ["Administrator Tools", "Administrator Peralatan", "Tools Administrator"],
    ["Tersedia", "Tersedia", "Available"],
    ["Direservasi", "Direservasi", "Reserved"],
    ["Dipinjam", "Dipinjam", "On Lending"],
    ["Dalam Perawatan", "Dalam Perawatan", "Under Maintenance"],
    ["Perawatan", "Perawatan", "Maintenance"],
    ["Rusak", "Rusak", "Damaged"],
    ["Hilang", "Hilang", "Missing"],
    ["Menunggu Persetujuan", "Menunggu Persetujuan", "Awaiting Approval"],
    ["Menunggu Approval", "Menunggu Persetujuan", "Awaiting Approval"],
    ["Ditolak", "Ditolak", "Rejected"],
    ["Disetujui", "Disetujui", "Approved"],
    ["Menunggu Serah Terima", "Menunggu Serah Terima", "Awaiting Handover"],
    ["Berjalan", "Berjalan", "In Progress"],
    ["Perlu Diperiksa", "Perlu Diperiksa", "Inspection Required"],
    ["Selesai", "Selesai", "Completed"],
    ["Terlambat", "Terlambat", "Overdue"],
    ["Draf", "Draf", "Draft"],
    ["Investigasi", "Investigasi", "Under Investigation"],
    ["Dilaporkan", "Dilaporkan", "Reported"],
    ["Dijadwalkan", "Dijadwalkan", "Scheduled"],
    ["Tidak Lengkap", "Tidak Lengkap", "Incomplete"],
    ["Sesuai", "Sesuai", "Matched"],
    ["Belum Discan", "Belum Dipindai", "Not Yet Scanned"],
    ["Belum discan", "Belum dipindai", "Not yet scanned"],
    ["Selisih Lokasi", "Selisih Lokasi", "Location Mismatch"],
    ["Kondisi Berbeda", "Kondisi Berbeda", "Condition Mismatch"],
    ["Tidak Ditemukan", "Tidak Ditemukan", "Not Found"],
    ["Berita Acara", "Berita Acara", "Official Report"],
    ["BERITA ACARA", "BERITA ACARA", "OFFICIAL REPORT"],
    ["Menunggu Keputusan", "Menunggu Keputusan", "Awaiting Decision"],
    ["Baik", "Baik", "Good"],
    ["Belum ada", "Belum ada", "None yet"],
    ["Belum diisi", "Belum diisi", "Not provided"],
    ["Belum dipilih", "Belum dipilih", "Not selected"],
    ["Belum ditentukan", "Belum ditentukan", "Not assigned"],
    ["Tanpa akun", "Tanpa akun", "Guest borrower"],
    ["Terhubung SSO", "Terhubung SSO", "SSO linked"],
    ["Akun aktif", "Akun aktif", "Active account"],
    ["tersedia", "tersedia", "available"],
    ["terpakai", "terpakai", "in use"],
    ["rusak", "rusak", "damaged"],
    ["hilang", "hilang", "missing"],
    ["baik", "baik", "good"],

    // Dashboard and catalogs
    ["Control desk", "Pusat kendali", "Control desk"],
    [
        "Pantau token, tenggat, dan status permohonan alat Anda.",
        "Pantau token, tenggat, dan status permohonan alat Anda.",
        "Track your tokens, due dates, and tool request status.",
    ],
    [
        "Prioritas operasional dan kondisi aset Workshop Trowulan hari ini.",
        "Prioritas operasional dan kondisi aset Workshop Trowulan hari ini.",
        "Today's operational priorities and asset condition at Workshop Trowulan.",
    ],
    ["Ajukan Pinjaman", "Ajukan Peminjaman", "Request a Lending"],
    ["Ajukan Peminjaman", "Ajukan Peminjaman", "Request a Lending"],
    ["Review Approval", "Tinjau Persetujuan", "Review Approvals"],
    ["Proses Pengembalian", "Proses Pengembalian", "Process a Return"],
    ["Kewajiban Terdekat", "Kewajiban Terdekat", "Upcoming Obligations"],
    ["Pinjaman Aktif", "Pinjaman Aktif", "Active Lendings"],
    [
        "Tidak ada pinjaman aktif.",
        "Tidak ada pinjaman aktif.",
        "No active Lendings.",
    ],
    ["Jejak Permohonan", "Riwayat Permohonan", "Request History"],
    ["Aktivitas Terbaru", "Aktivitas Terbaru", "Recent Activity"],
    ["Antrean Prioritas", "Antrean Prioritas", "Priority Queue"],
    ["Perlu perhatian", "Perlu perhatian", "Needs Attention"],
    ["Volume permohonan", "Volume permohonan", "Request Volume"],
    ["Distribusi kondisi", "Distribusi kondisi", "Condition Breakdown"],
    ["Jadwal Terdekat", "Jadwal Terdekat", "Upcoming Schedule"],
    ["Buka antrean", "Buka antrean", "Open Queue"],
    ["antrean", "antrean", "queue"],
    [
        "Cari ketersediaan, spesifikasi, dan lokasi penyimpanan alat kerja.",
        "Cari ketersediaan, spesifikasi, dan lokasi penyimpanan alat kerja.",
        "Find tool availability, specifications, and storage locations.",
    ],
    ["Asset directory", "Direktori aset", "Asset Directory"],
    ["Asset passport", "Paspor aset", "Asset Passport"],
    ["Kembali ke katalog", "Kembali ke katalog", "Back to Catalog"],
    [
        "Nama atau kode alat...",
        "Nama atau kode alat...",
        "Tool name or code...",
    ],
    ["Semua kategori", "Semua kategori", "All Categories"],
    [
        "Ubah kata kunci atau filter kategori.",
        "Ubah kata kunci atau filter kategori.",
        "Try a different keyword or category filter.",
    ],
    ["Alat tidak ditemukan", "Alat tidak ditemukan", "No Tools Found"],
    ["Ketersediaan", "Ketersediaan", "Availability"],
    ["Fungsi", "Fungsi", "Purpose"],
    [
        "Belum ada keterangan fungsi",
        "Belum ada keterangan fungsi",
        "No purpose has been provided",
    ],
    ["Aturan penggunaan", "Aturan penggunaan", "Usage Rules"],
    ["Unit tersedia", "Unit tersedia", "Available Units"],
    ["Pinjam Alat", "Pinjam Alat", "Borrow Tool"],
    ["Detail", "Detail", "Details"],
    ["Buka detail →", "Buka detail →", "View details →"],

    // Lendings and handovers
    ["Lending register", "Daftar peminjaman", "Lending Register"],
    ["Daftar peminjaman", "Daftar peminjaman", "Lending List"],
    [
        "Seluruh permohonan, pinjaman aktif, dan histori pengembalian.",
        "Seluruh permohonan, pinjaman aktif, dan riwayat pengembalian.",
        "All requests, active Lendings, and return history.",
    ],
    ["Pinjaman Baru", "Pinjaman Baru", "New Lending"],
    ["Belum ada peminjaman", "Belum ada peminjaman", "No Lendings yet"],
    ["Input Peminjaman", "Input Peminjaman", "Lending Details"],
    ["Kuota Peminjaman", "Kuota Peminjaman", "Lending Allowance"],
    ["Peminjaman Bulanan", "Peminjaman Bulanan", "Monthly Lendings"],
    ["Pinjaman Luar Area", "Pinjaman Luar Area", "Off-site Lending"],
    ["Perpanjangan Luar Area", "Perpanjangan Luar Area", "Off-site Extension"],
    ["New Lending request", "Permohonan pinjaman baru", "New Lending Request"],
    ["Pilih Alat", "Pilih Alat", "Select Tools"],
    ["Jenis dan Jumlah Alat", "Jenis dan Jumlah Alat", "Tools and Quantities"],
    ["Pilih Jenis Alat", "Pilih Jenis Alat", "Select Tool Type"],
    ["Jumlah diminta", "Jumlah diminta", "Quantity Requested"],
    ["Area penggunaan", "Area penggunaan", "Usage Area"],
    ["Area Pakai", "Area Penggunaan", "Usage Area"],
    ["Dalam area", "Dalam area", "On-site"],
    ["Luar area", "Luar area", "Off-site"],
    ["Penggunaan dalam area", "Penggunaan dalam area", "On-site Use"],
    ["Penggunaan luar area", "Penggunaan luar area", "Off-site Use"],
    ["Dalam Workshop", "Di Dalam Workshop", "Inside the Workshop"],
    ["Luar Workshop", "Di Luar Workshop", "Outside the Workshop"],
    [
        "Di mana alat digunakan?",
        "Di mana alat digunakan?",
        "Where will the tools be used?",
    ],
    ["Lokasi pekerjaan", "Lokasi pekerjaan", "Work Location"],
    ["Tujuan pekerjaan", "Tujuan pekerjaan", "Purpose of Work"],
    ["Tujuan penggunaan", "Tujuan penggunaan", "Purpose of Use"],
    ["Tanggal mulai", "Tanggal mulai", "Start Date"],
    ["Tanggal kembali", "Tanggal kembali", "Return Date"],
    ["Periode", "Periode", "Lending Period"],
    ["Tenggat pengembalian", "Tenggat pengembalian", "Return Due Date"],
    ["Dokumen Pendukung", "Dokumen Pendukung", "Supporting Documents"],
    ["Dokumen pendukung", "Dokumen pendukung", "Supporting Documents"],
    [
        "Surat tidak diperlukan untuk penggunaan dalam area.",
        "Surat tidak diperlukan untuk penggunaan dalam area.",
        "No request letter is required for on-site use.",
    ],
    [
        "Memerlukan periode, surat permohonan, dan approval.",
        "Memerlukan periode, surat permohonan, dan persetujuan.",
        "Requires a Lending period, request letter, and approval.",
    ],
    ["Kirim Permohonan", "Kirim Permohonan", "Submit Request"],
    [
        "Surat permohonan (PDF/JPG/PNG)",
        "Surat permohonan (PDF/JPG/PNG)",
        "Request Letter (PDF/JPG/PNG)",
    ],
    ["Buat Peminjaman", "Buat Peminjaman", "Create Lending"],
    ["Aturan peminjaman", "Aturan peminjaman", "Lending Rules"],
    [
        "Satu jenis alat membutuhkan satu token fisik.",
        "Satu jenis alat membutuhkan satu token fisik.",
        "Each tool type requires one physical token.",
    ],
    [
        "Masukkan satu kode token fisik milik Anda untuk setiap jenis alat.",
        "Masukkan satu kode token fisik milik Anda untuk setiap jenis alat.",
        "Enter one of your physical token codes for each tool type.",
    ],
    ["Lending passport", "Paspor peminjaman", "Lending Passport"],
    ["Detail Penggunaan", "Detail Penggunaan", "Usage Details"],
    [
        "Dokumen & persetujuan",
        "Dokumen dan persetujuan",
        "Documents and Approval",
    ],
    ["Diajukan oleh", "Diajukan oleh", "Requested By"],
    ["Disetujui oleh", "Disetujui oleh", "Approved By"],
    ["Buka Surat Permohonan", "Buka Surat Permohonan", "Open Request Letter"],
    ["Lihat Surat", "Lihat Surat", "View Letter"],
    ["Riwayat perpanjangan", "Riwayat perpanjangan", "Extension History"],
    ["Perpanjang", "Perpanjang", "Extend"],
    ["Perpanjang Tenggat", "Perpanjang Tenggat", "Extend Due Date"],
    ["Tenggat baru", "Tenggat baru", "New Due Date"],
    ["Tenggat lama", "Tenggat lama", "Previous Due Date"],
    ["Alasan perubahan", "Alasan perubahan", "Reason for Change"],
    ["Simpan Perpanjangan", "Simpan Perpanjangan", "Save Extension"],
    ["Serah terima", "Serah terima", "Handover"],
    ["SERAH TERIMA", "SERAH TERIMA", "HANDOVER"],
    ["Mulai Serah Terima", "Mulai Serah Terima", "Start Handover"],
    ["Petugas Gudang", "Petugas Gudang", "Warehouse Officer"],
    [
        "Pindai setiap label, periksa kelengkapan, lalu konfirmasi bersama",
        "Pindai setiap label, periksa kelengkapan, lalu konfirmasi bersama",
        "Scan each label, check all components, then confirm together with",
    ],
    [
        "Unit ditentukan saat serah terima",
        "Unit ditentukan saat serah terima",
        "Units are assigned during handover",
    ],
    ["Foto fisik wajib", "Foto fisik wajib", "Physical photos required"],
    ["Kondisi awal", "Kondisi awal", "Initial Condition"],
    [
        "Kepingan diterima petugas",
        "Keping diterima petugas",
        "Token Received by Officer",
    ],
    ["Token dan Barang", "Token dan Barang", "Token and Tools"],
    ["Token & Tinjau", "Token dan Tinjauan", "Token and Review"],
    [
        "Tolak dan Lepas Token",
        "Tolak dan Lepas Token",
        "Reject and Release Token",
    ],
    [
        "Cocokkan permohonan, kondisi awal, lokasi, dan jumlah unit yang benar-benar diterima.",
        "Cocokkan permohonan, kondisi awal, lokasi, dan jumlah unit yang benar-benar diterima.",
        "Verify the request, initial condition, location, and the units actually received.",
    ],
    ["Cocokkan Unit Fisik", "Cocokkan Unit Fisik", "Verify Physical Units"],
    [
        "Foto kondisi saat serah terima",
        "Foto kondisi saat serah terima",
        "Condition Photos at Handover",
    ],
    [
        "Saya menerima unit dalam kondisi yang dicatat.",
        "Saya menerima unit dalam kondisi yang dicatat.",
        "I received the units in the recorded condition.",
    ],
    ["Selesaikan Serah Terima", "Selesaikan Serah Terima", "Complete Handover"],
    [
        "Pilih transaksi, cocokkan unit, dan dokumentasikan kondisi fisik bersama peminjam.",
        "Pilih transaksi, cocokkan unit, dan dokumentasikan kondisi fisik bersama peminjam.",
        "Select a transaction, verify each unit, and document its physical condition with the borrower.",
    ],
    ["INSPEKSI KEMBALI", "INSPEKSI KEMBALI", "RETURN INSPECTION"],
    ["Pemeriksaan akhir", "Pemeriksaan akhir", "Final Inspection"],
    ["Daftar Unit", "Daftar Unit", "Unit List"],
    ["Pemeriksaan", "Pemeriksaan", "Inspection"],
    [
        "Anda dapat memproses unit yang sudah lengkap sekarang. Unit lain tetap aktif untuk pengembalian berikutnya.",
        "Anda dapat memproses unit yang sudah lengkap sekarang. Unit lain tetap aktif untuk pengembalian berikutnya.",
        "You can process completed units now. Other units remain active for a later return.",
    ],
    ["Menyimpan...", "Menyimpan...", "Saving..."],
    [
        "Kondisi hasil inspeksi",
        "Kondisi hasil inspeksi",
        "Condition After Inspection",
    ],
    ["Kelengkapan", "Kelengkapan", "Completeness"],
    [
        "Checklist kelengkapan",
        "Checklist kelengkapan",
        "Completeness Checklist",
    ],
    ["Catatan inspeksi", "Catatan inspeksi", "Inspection Notes"],
    ["Sebelumnya", "Sebelumnya", "Previous"],
    ["Unit Berikutnya", "Unit Berikutnya", "Next Unit"],
    ["Selesaikan Semua", "Selesaikan Semua", "Complete All"],
    ["Condition evidence", "Bukti kondisi", "Condition Evidence"],
    [
        "Perbandingan Sebelum & Sesudah",
        "Perbandingan Sebelum dan Sesudah",
        "Before & After Comparison",
    ],
    ["Sebelum · Serah Terima", "Sebelum · Serah Terima", "Before · Handover"],
    ["Sesudah · Pengembalian", "Sesudah · Pengembalian", "After · Return"],
    [
        "Bukti serah terima belum tersedia untuk item ini.",
        "Bukti serah terima belum tersedia untuk item ini.",
        "Handover evidence is not available for this item.",
    ],
    ["Dokumen PDF", "Dokumen PDF", "PDF Document"],
    ["Buka bukti", "Buka bukti", "Open evidence"],
    [
        "Bukti kondisi saat serah terima",
        "Bukti kondisi saat serah terima",
        "Condition evidence at handover",
    ],
    [
        "Pratinjau kondisi saat pengembalian",
        "Pratinjau kondisi saat pengembalian",
        "Return condition preview",
    ],
    [
        "Foto kondisi pengembalian",
        "Foto kondisi pengembalian",
        "Return Condition Photo",
    ],
    [
        "Ambil foto atau pilih dari galeri",
        "Ambil foto atau pilih dari galeri",
        "Take a photo or choose from your gallery",
    ],
    ["Ganti foto", "Ganti foto", "Change photo"],
    [
        "Saya telah memeriksa unit dan kelengkapan.",
        "Saya telah memeriksa unit dan kelengkapan.",
        "I have inspected the units and their components.",
    ],
    ["Selesaikan Pengembalian", "Selesaikan Pengembalian", "Complete Return"],
    [
        "Tidak ada antrean pengembalian",
        "Tidak ada antrean pengembalian",
        "The return queue is empty",
    ],
    [
        "Wajib dijelaskan jika rusak, tidak lengkap, atau hilang...",
        "Wajib dijelaskan jika rusak, tidak lengkap, atau hilang...",
        "Required if damaged, incomplete, or missing...",
    ],
    [
        "Temuan rusak atau hilang akan otomatis membuka kasus pertanggungjawaban. Berita Acara wajib dilengkapi setelah inspeksi.",
        "Temuan rusak atau hilang akan otomatis membuka kasus pertanggungjawaban. Berita Acara wajib dilengkapi setelah inspeksi.",
        "Any damaged or missing unit automatically opens an accountability case. An official report must be completed after inspection.",
    ],
    [
        "Item rusak, tidak lengkap, atau hilang akan disimpan sebagai kasus dan belum diterima sebagai pengembalian. Token baru dilepas setelah Berita Acara dan keputusan kasus selesai.",
        "Item rusak, tidak lengkap, atau hilang akan disimpan sebagai kasus dan belum diterima sebagai pengembalian. Token baru dilepas setelah Berita Acara dan keputusan kasus selesai.",
        "Damaged, incomplete, or missing items will be saved as cases and will not yet be accepted as returned. The token is released only after the official report and case decision are completed.",
    ],
    [
        "Kronologi minimal 5 karakter wajib diisi untuk item bermasalah.",
        "Kronologi minimal 5 karakter wajib diisi untuk item bermasalah.",
        "A chronology of at least 5 characters is required for an affected item.",
    ],

    // Inventory, maintenance, audit
    [
        "Inventaris & Penerimaan",
        "Inventaris dan Penerimaan",
        "Inventory and Receiving",
    ],
    [
        "Daftarkan aset masuk, cetak label, dan telusuri posisi setiap unit.",
        "Daftarkan aset masuk, cetak label, dan telusuri posisi setiap unit.",
        "Register incoming assets, print labels, and track every unit's location.",
    ],
    ["Penerimaan Baru", "Penerimaan Baru", "New Receipt"],
    ["Penerimaan Aset", "Penerimaan Aset", "Asset Receiving"],
    ["Receiving log", "Catatan penerimaan", "Receiving Log"],
    ["Penerimaan Terbaru", "Penerimaan Terbaru", "Recent Receipts"],
    ["Receiving workflow", "Alur penerimaan", "Receiving Workflow"],
    ["Dokumen Penerimaan", "Dokumen Penerimaan", "Receiving Document"],
    ["Tanggal diterima", "Tanggal diterima", "Date Received"],
    ["Vendor", "Pemasok", "Vendor"],
    ["Referensi permohonan", "Referensi permohonan", "Request Reference"],
    ["Manifest alat", "Daftar alat", "Tool Manifest"],
    ["Jenis alat", "Jenis alat", "Tool Type"],
    ["Jenis Alat", "Jenis Alat", "Tool Type"],
    ["Jenis Baru", "Jenis Baru", "New Tool Type"],
    ["Master item", "Data induk barang", "Item Master"],
    [
        "Nama dan kode mengikuti Master Item Buana Multi.",
        "Nama dan kode mengikuti Data Induk Barang Buana Multi.",
        "Names and codes follow the Buana Multi Item Master.",
    ],
    ["Jumlah diterima", "Jumlah diterima", "Quantity Received"],
    ["Tambah Baris", "Tambah Baris", "Add Row"],
    [
        "Selesaikan & Buat Kode Aset",
        "Selesaikan dan Buat Kode Aset",
        "Complete and Generate Asset Codes",
    ],
    ["Unit yang Dibuat", "Unit yang Dibuat", "Created Units"],
    [
        "Lengkapi data dan periksa kembali kode unit.",
        "Lengkapi data dan periksa kembali kode unit.",
        "Complete the details and verify each unit code.",
    ],
    ["Cetak Semua Label", "Cetak Semua Label", "Print All Labels"],
    ["Daftar Unit", "Daftar Unit", "Unit List"],
    ["Kode aset", "Kode aset", "Asset Code"],
    ["Kondisi", "Kondisi", "Condition"],
    ["Lokasi utama", "Lokasi utama", "Primary Location"],
    ["Lokasi akhir", "Lokasi akhir", "Final Location"],
    ["Lokasi Baru", "Lokasi Baru", "New Location"],
    ["Alasan mutasi", "Alasan mutasi", "Reason for Move"],
    ["Mutasi Lokasi", "Mutasi Lokasi", "Move Location"],
    ["Lokasi awal", "Lokasi awal", "Current Location"],
    ["Lokasi tujuan", "Lokasi tujuan", "Destination"],
    ["Alasan pemindahan", "Alasan pemindahan", "Reason for Move"],
    ["Konfirmasi Mutasi", "Konfirmasi Mutasi", "Confirm Move"],
    ["Maintenance control", "Kendali pemeliharaan", "Maintenance Control"],
    [
        "Jadwalkan pembersihan, inspeksi, kalibrasi, servis, dan perbaikan unit.",
        "Jadwalkan pembersihan, inspeksi, kalibrasi, servis, dan perbaikan unit.",
        "Schedule cleaning, inspection, calibration, servicing, and unit repairs.",
    ],
    ["Work Order Baru", "Perintah Kerja Baru", "New Work Order"],
    ["Buat Work Order", "Buat Perintah Kerja", "Create Work Order"],
    ["Jenis/Tindakan", "Jenis/Tindakan", "Type/Action"],
    ["Pelaksana", "Pelaksana", "Assigned To"],
    ["Teknisi", "Teknisi", "Technician"],
    ["Jadwal", "Jadwal", "Schedule"],
    ["Catatan hasil", "Catatan hasil", "Outcome Notes"],
    [
        "Lengkapi status dan foto unit ini.",
        "Lengkapi status dan foto unit ini.",
        "Complete this unit's status and photos.",
    ],
    ["Foto setelah pekerjaan", "Foto setelah pekerjaan", "Photos After Work"],
    ["Simpan Hasil", "Simpan Hasil", "Save Outcome"],
    ["Stock assurance", "Kendali stok", "Stock Assurance"],
    [
        "Buat snapshot, pindai unit, dan rekonsiliasi selisih secara bulanan.",
        "Buat rekaman stok, pindai unit, dan rekonsiliasi selisih setiap bulan.",
        "Create stock snapshots, scan units, and reconcile discrepancies each month.",
    ],
    ["Audit Baru", "Audit Baru", "New Audit"],
    ["Buka Sesi", "Buka Sesi", "Open Session"],
    ["Buat Snapshot Audit", "Buat Rekaman Audit", "Create Audit Snapshot"],
    ["Buat Snapshot Stok", "Buat Rekaman Stok", "Create Stock Snapshot"],
    ["Audit Berjalan", "Audit Berjalan", "Active Audits"],
    ["Belum ada sesi audit", "Belum ada sesi audit", "No audit sessions yet"],
    ["Daftar audit", "Daftar audit", "Audit List"],
    ["Mulai Audit", "Mulai Audit", "Start Audit"],
    ["Lanjutkan Audit", "Lanjutkan Audit", "Continue Audit"],
    [
        "Masukkan label aset dan kondisi aktual.",
        "Masukkan label aset dan kondisi aktual.",
        "Enter the asset label and current condition.",
    ],
    ["Catatan reviewer...", "Catatan peninjau...", "Reviewer notes..."],
    ["Alasan selisih", "Alasan selisih", "Reason for Discrepancy"],
    ["Selisih:", "Selisih:", "Discrepancies:"],
    ["Catat Hasil Scan", "Catat Hasil Pindai", "Record Scan Result"],
    ["Snapshot progress", "Kemajuan audit", "Audit Progress"],
    ["Live stock count", "Penghitungan stok langsung", "Live Stock Count"],
    ["Harapan:", "Seharusnya:", "Expected:"],
    ["Aktual:", "Aktual:", "Actual:"],
    [
        "Perbarui lokasi dan kondisi unit dari hasil scan",
        "Perbarui lokasi dan kondisi unit dari hasil pindai",
        "Update unit locations and conditions from scan results",
    ],
    ["Finalisasi Audit", "Finalisasi Audit", "Finalize Audit"],

    // Approvals, cases, reports, administration
    ["Decision queue", "Antrean keputusan", "Decision Queue"],
    ["Approval Logistik", "Persetujuan Logistik", "Logistics Approvals"],
    [
        "Tinjau pinjaman luar area dan permohonan perpanjangan periode.",
        "Tinjau pinjaman luar area dan permohonan perpanjangan waktu.",
        "Review off-site Lendings and extension requests.",
    ],
    [
        "Tidak ada approval pinjaman",
        "Tidak ada persetujuan pinjaman",
        "No Lending requests are awaiting approval",
    ],
    [
        "Tidak ada permohonan perpanjangan",
        "Tidak ada permohonan perpanjangan",
        "No extension requests are awaiting approval",
    ],
    ["Review Keputusan", "Tinjau Keputusan", "Review Decision"],
    ["Alasan penolakan:", "Alasan penolakan:", "Reason for Rejection:"],
    ["Tolak Permohonan", "Tolak Permohonan", "Reject Request"],
    ["Accountability desk", "Pusat pertanggungjawaban", "Accountability Desk"],
    ["Kerusakan & Kehilangan", "Kerusakan dan Kehilangan", "Damage and Loss"],
    [
        "Kelengkapan bukti, Berita Acara, keputusan, dan penggantian aset.",
        "Kelengkapan bukti, Berita Acara, keputusan, dan penggantian aset.",
        "Track evidence, official reports, decisions, and asset replacements.",
    ],
    [
        "Tidak ada kasus tercatat",
        "Tidak ada kasus tercatat",
        "No cases recorded",
    ],
    ["Daftar kasus", "Daftar kasus", "Case List"],
    ["Kelola Kasus", "Kelola Kasus", "Manage Case"],
    ["Case file", "Berkas kasus", "Case File"],
    ["Unit tidak diketahui", "Unit tidak diketahui", "Unknown Unit"],
    ["Pengembalian tertahan", "Pengembalian tertahan", "Return on Hold"],
    ["Token belum dilepas", "Token belum dilepas", "Token Not Released"],
    ["Buka Transaksi", "Buka Transaksi", "Open Transaction"],
    ["Item dari transaksi", "Item dari transaksi", "The item from transaction"],
    [
        "baru dianggap selesai dikembalikan setelah kasus ini ditutup dengan Berita Acara dan keputusan final.",
        "baru dianggap selesai dikembalikan setelah kasus ini ditutup dengan Berita Acara dan keputusan final.",
        "is only considered returned after this case is closed with an official report and final decision.",
    ],
    ["Kronologi", "Kronologi", "Incident Timeline"],
    ["Penanggung jawab", "Penanggung jawab", "Person Responsible"],
    ["Kelengkapan berkas", "Kelengkapan berkas", "Document Checklist"],
    ["Buka Berita Acara", "Buka Berita Acara", "Open Official Report"],
    ["BUKTI", "BUKTI", "EVIDENCE"],
    ["KEPUTUSAN", "KEPUTUSAN", "DECISION"],
    [
        "Hasil review: perbaiki, beli pengganti, atau keputusan lainnya...",
        "Hasil tinjauan: perbaiki, beli pengganti, atau keputusan lainnya...",
        "Review outcome: repair, purchase a replacement, or record another decision...",
    ],
    [
        "Kasus hanya dapat ditutup jika Berita Acara dan keputusan lembaga sudah lengkap.",
        "Kasus hanya dapat ditutup jika Berita Acara dan keputusan lembaga sudah lengkap.",
        "A case can only be closed after the official report and institutional decision are complete.",
    ],
    ["Keputusan lembaga", "Keputusan lembaga", "Institutional Decision"],
    [
        "Case resolution workflow",
        "Alur penyelesaian kasus",
        "Case Resolution Workflow",
    ],
    ["Tindak Lanjut", "Tindak Lanjut", "Resolution"],
    ["Tahap", "Tahap", "Stage"],
    ["Status penyelesaian", "Status penyelesaian", "Resolution Status"],
    ["Belum diproses", "Belum diproses", "Not Processed"],
    ["Dalam proses", "Dalam proses", "In Progress"],
    ["Diperbaiki", "Diperbaiki", "Repaired"],
    ["Diganti unit lain", "Diganti unit lain", "Replaced with Another Unit"],
    ["Dibelikan unit baru", "Dibelikan unit baru", "New Unit Purchased"],
    [
        "Tidak perlu penggantian",
        "Tidak perlu penggantian",
        "No Replacement Required",
    ],
    [
        "Tanggung jawab dibebaskan",
        "Tanggung jawab dibebaskan",
        "Liability Waived",
    ],
    [
        "Unit pengganti (opsional)",
        "Unit pengganti (opsional)",
        "Replacement Unit (Optional)",
    ],
    [
        "Unit pengganti / unit hasil pembelian",
        "Unit pengganti / unit hasil pembelian",
        "Replacement / Purchased Unit",
    ],
    [
        "Wajib untuk keputusan “diganti” atau “dibelikan baru”. Unit hasil pembelian harus dicatat di penerimaan aset terlebih dahulu.",
        "Wajib untuk keputusan “diganti” atau “dibelikan baru”. Unit hasil pembelian harus dicatat di penerimaan aset terlebih dahulu.",
        "Required for a replaced or newly purchased resolution. A purchased unit must first be recorded through asset receiving.",
    ],
    [
        "Menutup kasus akan menyelesaikan pengembalian item dan melepas token peminjam. Berita Acara, keputusan, dan hasil penyelesaian wajib lengkap.",
        "Menutup kasus akan menyelesaikan pengembalian item dan melepas token peminjam. Berita Acara, keputusan, dan hasil penyelesaian wajib lengkap.",
        "Closing the case completes the item return and releases the borrower's token. The official report, decision, and resolution must be complete.",
    ],
    [
        "Tutup Kasus & Selesaikan Pengembalian",
        "Tutup Kasus dan Selesaikan Pengembalian",
        "Close Case & Complete Return",
    ],
    ["Simpan Tindak Lanjut", "Simpan Tindak Lanjut", "Save Resolution"],
    ["Management insight", "Wawasan manajemen", "Management Insights"],
    ["Laporan Aset", "Laporan Aset", "Asset Reports"],
    [
        "Snapshot ketersediaan, sirkulasi, dan risiko aset Workshop Trowulan.",
        "Ringkasan ketersediaan, sirkulasi, dan risiko aset Workshop Trowulan.",
        "A snapshot of asset availability, circulation, and risk at Workshop Trowulan.",
    ],
    ["Pinjaman Bulanan", "Pinjaman Bulanan", "Monthly Lendings"],
    ["Transaksi Terkini", "Transaksi Terkini", "Recent Transactions"],
    ["Audit Trail", "Jejak Audit", "Audit Trail"],
    ["Aset CSV", "CSV Aset", "Asset CSV"],
    ["Pinjaman CSV", "CSV Peminjaman", "Lendings CSV"],
    ["Audit CSV", "CSV Audit", "Audit CSV"],
    ["Cetak / Simpan PDF", "Cetak / Simpan PDF", "Print / Save as PDF"],
    ["System control", "Kendali sistem", "System Control"],
    ["Asset control", "Kendali aset", "Asset Control"],
    ["Operations registry", "Daftar operasional", "Operations Registry"],
    ["Inspection queue", "Antrean pemeriksaan", "Inspection Queue"],
    ["Receiving record", "Catatan penerimaan", "Receiving Record"],
    ["Task inbox", "Kotak tugas", "Task Inbox"],
    ["Focus workflow", "Alur kerja terfokus", "Focused Workflow"],
    ["Secure access point", "Akses aman", "Secure Access"],
    ["Item manifest", "Daftar barang", "Item Manifest"],
    ["Decision authority", "Wewenang keputusan", "Decision Authority"],
    ["Original Manufacture", "Produsen Asli", "Original Manufacturer"],
    ["Manufacture PN", "Nomor Komponen Produsen", "Manufacturer Part Number"],
    [
        "Kelola akses, peminjam, token fisik, master data, parameter, dan audit trail.",
        "Kelola akses, peminjam, token fisik, data induk, parameter, dan jejak audit.",
        "Manage access, borrowers, physical tokens, master data, settings, and the audit trail.",
    ],
    ["Akun & Hak Akses", "Akun dan Hak Akses", "Accounts and Access"],
    ["Pengguna", "Pengguna", "Users"],
    ["Hak akses:", "Hak akses:", "Access:"],
    ["APPROVER DIPILIH", "PEMBERI PERSETUJUAN DIPILIH", "SELECTED APPROVER"],
    ["Simpan Kewenangan", "Simpan Kewenangan", "Save Authority"],
    [
        "Peminjam & Kepingan Token",
        "Peminjam dan Keping Token",
        "Borrowers and Physical Tokens",
    ],
    ["Peminjam Tanpa Akun", "Peminjam Tanpa Akun", "Guest Borrower"],
    [
        "Profil peminjam tanpa akun",
        "Profil peminjam tanpa akun",
        "Guest Borrower Profile",
    ],
    [
        "Profil dapat terhubung ke akun SSO atau berdiri sendiri untuk peminjam yang datang langsung.",
        "Profil dapat terhubung ke akun SSO atau berdiri sendiri untuk peminjam yang datang langsung.",
        "A profile can be linked to an SSO account or remain standalone for walk-in borrowers.",
    ],
    [
        "Layani peminjam berakun maupun tamu. Satu kepingan token unik ditukar untuk setiap alat.",
        "Layani peminjam berakun maupun tamu. Satu keping token unik ditukar untuk setiap alat.",
        "Serve account holders and guest borrowers. One unique physical token is exchanged for each tool.",
    ],
    ["Daftarkan Kepingan", "Daftarkan Keping Token", "Register Tokens"],
    ["Kepingan", "Keping Token", "Physical Token"],
    ["Aturan token fisik", "Aturan token fisik", "Physical Token Rules"],
    [
        "Setiap alat memakai satu kepingan berbeda. Token dikembalikan setelah inspeksi barang selesai.",
        "Setiap alat memakai satu keping berbeda. Token dikembalikan setelah inspeksi barang selesai.",
        "Each tool requires a different token. Tokens are returned after the tool passes inspection.",
    ],
    [
        "Token sedang digunakan. Selesaikan atau batalkan transaksi terlebih dahulu sebelum memindahkan kepemilikan.",
        "Token sedang digunakan. Selesaikan atau batalkan transaksi terlebih dahulu sebelum memindahkan kepemilikan.",
        "This token is in use. Complete or cancel the transaction before transferring ownership.",
    ],
    ["Pindahkan Token", "Pindahkan Token", "Transfer Token"],
    ["PINDAH KEPEMILIKAN", "PINDAH KEPEMILIKAN", "TRANSFER OWNERSHIP"],
    ["Pemilik sekarang:", "Pemilik sekarang:", "Current Owner:"],
    ["Pemilik baru", "Pemilik baru", "New Owner"],
    ["Token untuk", "Token untuk", "Token for"],
    [
        "Tidak ada token tersedia",
        "Tidak ada token tersedia",
        "No tokens available",
    ],
    ["Belum ada token", "Belum ada token", "No tokens yet"],
    ["Master Aset", "Data Induk Aset", "Asset Master Data"],
    ["Master Checklist", "Master Daftar Periksa", "Checklist Library"],
    ["Inspection standards", "Standar pemeriksaan", "Inspection Standards"],
    [
        "Kelola satu pustaka pemeriksaan yang dapat dipakai ulang oleh berbagai jenis aset.",
        "Kelola satu pustaka pemeriksaan yang dapat dipakai ulang oleh berbagai jenis aset.",
        "Maintain a reusable library of inspection points for every asset type.",
    ],
    ["Checklist pemeriksaan", "Daftar pemeriksaan", "Inspection Checklist"],
    [
        "Pilih poin yang wajib diperiksa untuk jenis aset ini.",
        "Pilih poin yang wajib diperiksa untuk jenis aset ini.",
        "Select the checks required for this asset type.",
    ],
    [
        "Belum ada master checklist. Tambahkan melalui tab Master Checklist.",
        "Belum ada master daftar periksa. Tambahkan melalui tab Master Daftar Periksa.",
        "The checklist library is empty. Add inspection points from the Checklist Library tab.",
    ],
    [
        "Pilih minimal satu poin checklist.",
        "Pilih minimal satu poin pemeriksaan.",
        "Select at least one inspection point.",
    ],
    ["Poin pemeriksaan baru", "Poin pemeriksaan baru", "New Inspection Point"],
    ["Tambah Checklist", "Tambah Daftar Periksa", "Add Inspection Point"],
    [
        "Tulis satu pemeriksaan yang jelas dan dapat dijawab ya atau tidak.",
        "Tulis satu pemeriksaan yang jelas dan dapat dijawab ya atau tidak.",
        "Write one clear check that can be answered with yes or no.",
    ],
    ["Poin checklist", "Poin pemeriksaan", "Inspection Point"],
    [
        "Contoh: Kabel daya tidak terkelupas",
        "Contoh: Kabel daya tidak terkelupas",
        "Example: Power cable insulation is intact",
    ],
    ["Tambah Poin", "Tambah Poin", "Add Point"],
    ["Ubah Poin Checklist", "Ubah Poin Pemeriksaan", "Edit Inspection Point"],
    [
        "Belum ada poin checklist.",
        "Belum ada poin pemeriksaan.",
        "No inspection points yet.",
    ],
    [
        "Hapus poin checklist",
        "Hapus poin pemeriksaan",
        "Delete inspection point",
    ],
    [
        "Lepaskan dari semua master aset sebelum menghapus",
        "Lepaskan dari semua master aset sebelum menghapus",
        "Remove this point from every asset type before deleting it",
    ],
    [
        "Hapus poin checklist?",
        "Hapus poin pemeriksaan?",
        "Delete Inspection Point?",
    ],
    [
        "Poin checklist ditambahkan.",
        "Poin pemeriksaan ditambahkan.",
        "Inspection point added.",
    ],
    [
        "Poin checklist diperbarui.",
        "Poin pemeriksaan diperbarui.",
        "Inspection point updated.",
    ],
    [
        "Poin checklist dihapus.",
        "Poin pemeriksaan dihapus.",
        "Inspection point deleted.",
    ],
    [
        "Poin checklist masih digunakan oleh master aset dan tidak dapat dihapus.",
        "Poin pemeriksaan masih digunakan oleh master aset dan tidak dapat dihapus.",
        "This inspection point is still assigned to an asset type and cannot be deleted.",
    ],
    ["Kategori Aset", "Kategori Aset", "Asset Categories"],
    ["Kategori Baru", "Kategori Baru", "New Category"],
    [
        "Kelompokkan master aset berdasarkan fungsi penggunaan.",
        "Kelompokkan data induk aset berdasarkan fungsi penggunaan.",
        "Group asset master data by operational purpose.",
    ],
    ["Hapus master aset?", "Hapus data induk aset?", "Delete Asset Master?"],
    ["Hapus kategori?", "Hapus kategori?", "Delete Category?"],
    ["Parameter Operasional", "Parameter Operasional", "Operational Settings"],
    ["Struktur Lokasi", "Struktur Lokasi", "Location Structure"],
    [
        "Area induk ditampilkan bersama seluruh ruang, rak, dan slot di bawahnya.",
        "Area induk ditampilkan bersama seluruh ruang, rak, dan slot di bawahnya.",
        "Parent areas are shown with all rooms, racks, and slots beneath them.",
    ],
    ["Tanpa induk", "Tanpa induk", "No Parent"],
    ["Tambah Lokasi", "Tambah Lokasi", "Add Location"],
    ["Tambah Peminjam", "Tambah Peminjam", "Add Borrower"],
    ["Tambah Token", "Tambah Token", "Add Token"],
    ["Tambah Kategori", "Tambah Kategori", "Add Category"],
    ["Tambah Jenis", "Tambah Jenis", "Add Tool Type"],
    ["Simpan Perubahan", "Simpan Perubahan", "Save Changes"],
    ["Simpan Pengaturan", "Simpan Pengaturan", "Save Settings"],
    ["Simpan Akses", "Simpan Akses", "Save Access"],
    ["Simpan Approver", "Simpan Pemberi Persetujuan", "Save Approvers"],
    [
        "Penanggung Jawab Approval",
        "Penanggung Jawab Persetujuan",
        "Approval Authority",
    ],
    [
        "Pilih akun yang berhak melihat antrean serta menyetujui atau menolak pinjaman dan perpanjangan luar area.",
        "Pilih akun yang berhak melihat antrean serta menyetujui atau menolak pinjaman dan perpanjangan luar area.",
        "Choose the accounts authorized to review, approve, or reject off-site Lendings and extensions.",
    ],
    [
        "Pengguna dan hak akses disinkronkan dari grup Tools Management pada aplikasi utama.",
        "Pengguna dan hak akses disinkronkan dari grup Manajemen Peralatan pada aplikasi utama.",
        "Users and permissions are synchronized from the Tools Management group in the main application.",
    ],
    [
        "Belum ada Kepala Logistik atau Administrator aktif.",
        "Belum ada Kepala Logistik atau Administrator aktif.",
        "There is no active Head of Logistics or Administrator.",
    ],
    [
        "Minimal satu approver wajib aktif agar permohonan tidak tertahan tanpa pengambil keputusan.",
        "Minimal satu pemberi persetujuan wajib aktif agar permohonan tidak tertahan tanpa pengambil keputusan.",
        "At least one approver must be active so requests always have a decision maker.",
    ],
    [
        "Parameter ini mengatur batas dan perilaku proses aplikasi. Alasan perubahan disimpan di Audit Trail agar perubahan konfigurasi dapat ditelusuri; isinya tidak mengubah perhitungan sistem.",
        "Parameter ini mengatur batas dan perilaku proses aplikasi. Alasan perubahan disimpan di Jejak Audit agar perubahan konfigurasi dapat ditelusuri; isinya tidak mengubah perhitungan sistem.",
        "These settings control application limits and workflows. Change reasons are recorded in the audit trail for traceability and do not alter system calculations.",
    ],
    [
        "Peringatan tenggat, keputusan approval, dan tugas yang membutuhkan tindakan.",
        "Peringatan tenggat, keputusan persetujuan, dan tugas yang membutuhkan tindakan.",
        "Due-date alerts, approval decisions, and tasks that require action.",
    ],
    ["Belum ada notifikasi", "Belum ada notifikasi", "No notifications yet"],
    ["Tandai dibaca", "Tandai dibaca", "Mark as Read"],
    ["Tandai Semua Dibaca", "Tandai Semua Dibaca", "Mark All as Read"],

    // Generic fields and controls
    ["Nama", "Nama", "Name"],
    ["Email", "Surel", "Email"],
    ["Status", "Status", "Status"],
    ["Jenis", "Jenis", "Type"],
    ["Kategori", "Kategori", "Category"],
    ["Unit", "Unit", "Unit"],
    ["Alat", "Alat", "Tool"],
    ["Kode", "Kode", "Code"],
    ["Label", "Label", "Label"],
    ["Tipe", "Tipe", "Type"],
    ["Kontak", "Kontak", "Contact"],
    ["Lembaga", "Lembaga", "Institution"],
    ["Kapasitas", "Kapasitas", "Capacity"],
    ["Catatan", "Catatan", "Notes"],
    ["Alasan", "Alasan", "Reason"],
    ["Tindakan", "Tindakan", "Action"],
    ["Transaksi", "Transaksi", "Transaction"],
    ["Pemeriksaan", "Pemeriksaan", "Inspection"],
    ["Total Unit", "Total Unit", "Total Units"],
    ["Token tersedia", "Token tersedia", "Available Tokens"],
    ["Semua lokasi", "Semua lokasi", "All Locations"],
    ["Pilih...", "Pilih...", "Select..."],
    ["Pilih opsi", "Pilih opsi", "Select an option"],
    ["Pilih lokasi", "Pilih lokasi", "Select a location"],
    ["Pilih lokasi...", "Pilih lokasi...", "Select a location..."],
    ["Pilih jenis...", "Pilih jenis...", "Select a type..."],
    ["Pilih status", "Pilih status", "Select a status"],
    ["Pilih token peminjam", "Pilih token peminjam", "Select a borrower token"],
    ["pilih peminjam", "pilih peminjam", "select a borrower"],
    ["Pilih file Excel", "Pilih file Excel", "Choose an Excel file"],
    ["Pilih item Tool...", "Pilih item Tool...", "Select a Tool item..."],
    ["Pilih unit", "Pilih unit", "Select a unit"],
    [
        "Pilih user BMT Multi...",
        "Pilih user BMT Multi...",
        "Select a BMT Multi user...",
    ],
    [
        "Pilih jenis alat dan lokasi sebelum menambahkan item.",
        "Pilih jenis alat dan lokasi sebelum menambahkan item.",
        "Select a tool type and location before adding the item.",
    ],
    [
        "Cari kode aset, jenis, atau owner...",
        "Cari kode aset, jenis, atau owner...",
        "Search by asset code, type, or owner...",
    ],
    [
        "Cari nomor NPB, peminta, atau nama item...",
        "Cari nomor NPB, peminta, atau nama item...",
        "Search by NPB number, requester, or item name...",
    ],
    ["Belum ada data", "Belum ada data", "No data yet"],
    [
        "Data akan tampil di sini setelah tersedia.",
        "Data akan tampil di sini setelah tersedia.",
        "Data will appear here once available.",
    ],
    ["Belum dikonfigurasi", "Belum dikonfigurasi", "Not configured"],
    ["Belum ditetapkan", "Belum ditetapkan", "Not assigned"],
    ["Belum terhubung", "Belum terhubung", "Not linked"],
    ["Tanpa peminta", "Tanpa peminta", "No requester"],
    ["Tanpa referensi PO", "Tanpa referensi PO", "No PO reference"],
    ["Tidak tersedia", "Tidak tersedia", "Unavailable"],
    ["Nomor PO", "Nomor PO", "PO Number"],
    ["Nomor PO per ITEM NO", "Nomor PO per ITEM NO", "PO number per ITEM NO"],
    [
        "Diterapkan ke semua unit dari ITEM NO ini",
        "Diterapkan ke semua unit dari ITEM NO ini",
        "Applied to every unit under this ITEM NO",
    ],
    ["Sumber PO", "Sumber PO", "PO Source"],
    ["Owner Item", "Owner Item", "Item Owner"],
    [
        "Owner belum ditetapkan",
        "Owner belum ditetapkan",
        "Owner has not been assigned",
    ],
    ["Tanggal masuk", "Tanggal masuk", "Received Date"],
    ["Lokasi Utama", "Lokasi Utama", "Primary Location"],
    ["Lokasi aktual", "Lokasi aktual", "Actual Location"],
    ["Kondisi aktual", "Kondisi aktual", "Actual Condition"],
    ["Jadwal berikutnya", "Jadwal berikutnya", "Next Schedule"],
    ["Inspeksi wajib", "Inspeksi wajib", "Inspection required"],
    ["Kasus terbuka", "Kasus terbuka", "Open Cases"],
    ["Perlu servis", "Perlu servis", "Service Required"],
    ["Kode Aset", "Kode Aset", "Asset Code"],
    ["Nama Audit", "Nama Audit", "Audit Name"],
    ["Nama audit", "Nama audit", "Audit name"],
    ["Nomor Kasus", "Nomor Kasus", "Case Number"],
    ["Nama item", "Nama item", "Item name"],
    ["Nama lengkap", "Nama lengkap", "Full name"],
    ["Nama pabrikan", "Nama pabrikan", "Manufacturer name"],
    ["Nomor artikel", "Nomor artikel", "Article number"],
    ["Peminjam & Token", "Peminjam dan Token", "Borrowers & Tokens"],
    [
        "Alasan perubahan (catatan audit)",
        "Alasan perubahan (catatan audit)",
        "Change reason (audit note)",
    ],
    [
        "Batasi lokasi (opsional)",
        "Batasi lokasi (opsional)",
        "Limit location (optional)",
    ],
    ["Foto bukti", "Foto bukti", "Evidence photos"],
    [
        "Tutup filter lanjutan",
        "Tutup filter lanjutan",
        "Close advanced filters",
    ],
    ["Tutup modal NPB", "Tutup modal NPB", "Close NPB dialog"],
    ["Simpan Penerimaan", "Simpan Penerimaan", "Save Receipt"],
    [
        "Opsional · PDF, JPG, atau PNG maksimal 5 MB",
        "Opsional · PDF, JPG, atau PNG maksimal 5 MB",
        "Optional · PDF, JPG, or PNG up to 5 MB",
    ],
    ["Alasan wajib", "Alasan wajib", "Reason required"],
    [
        "Checklist kelengkapan",
        "Checklist kelengkapan",
        "Completeness checklist",
    ],
    ["Kode unit", "Kode unit", "Unit code"],
    ["Metadata", "Metadata", "Metadata"],
    ["Owner Aset", "Owner Aset", "Asset Owner"],
    [
        "Pilih kriteria tambahan...",
        "Pilih kriteria tambahan...",
        "Select additional criteria...",
    ],
    ["Semua status", "Semua status", "All statuses"],
    [
        "Qty diterima harus antara 1 sampai 100.",
        "Qty diterima harus antara 1 sampai 100.",
        "Received quantity must be between 1 and 100.",
    ],
    [
        "Lengkapi lokasi dan qty setiap item sebelum menyimpan.",
        "Lengkapi lokasi dan qty setiap item sebelum menyimpan.",
        "Complete the location and quantity for every item before saving.",
    ],
    [
        "Susun manifest penerimaan, periksa jumlah aktual, lalu buat kode aset dalam satu proses.",
        "Susun manifest penerimaan, periksa jumlah aktual, lalu buat kode aset dalam satu proses.",
        "Build the receiving manifest, verify actual quantities, and generate asset codes in one workflow.",
    ],
    [
        "Tuliskan batas penggunaan, kewajiban APD, durasi, dan ketentuan pengembalian.",
        "Tuliskan batas penggunaan, kewajiban APD, durasi, dan ketentuan pengembalian.",
        "Describe usage limits, PPE requirements, duration, and return conditions.",
    ],
    [
        "Ubah kata kunci, kategori, atau kriteria filter lanjutan.",
        "Ubah kata kunci, kategori, atau kriteria filter lanjutan.",
        "Change the keyword, category, or advanced filter criteria.",
    ],
    [
        "Approval final setelah seluruh owner item menyetujui permohonan.",
        "Persetujuan final setelah seluruh owner item menyetujui permohonan.",
        "Final approval after every item owner approves the request.",
    ],
    [
        "Memerlukan periode, surat, approval owner, dan Kepala Logistik.",
        "Memerlukan periode, surat, persetujuan owner, dan Kepala Logistik.",
        "Requires a lending period, request letter, owner approval, and Head of Logistics approval.",
    ],
    [
        "Tenggat Jumat terdekat; memerlukan approval owner dan Kepala Logistik.",
        "Tenggat Jumat terdekat; memerlukan persetujuan owner dan Kepala Logistik.",
        "Due next Friday; requires owner and Head of Logistics approval.",
    ],
    [
        "Pilihan tidak ditemukan.",
        "Pilihan tidak ditemukan.",
        "No options found.",
    ],
    ["Cari pilihan...", "Cari pilihan...", "Search options..."],
    [
        "Ambil foto atau pilih dari galeri",
        "Ambil foto atau pilih dari galeri",
        "Take a photo or choose one from your gallery",
    ],
    ["JPG/PNG maksimal 5 MB", "JPG/PNG maksimal 5 MB", "JPG/PNG, up to 5 MB"],
    ["Menyimpan...", "Menyimpan...", "Saving..."],
    ["Memproses...", "Memproses...", "Processing..."],
    ["Memverifikasi...", "Memverifikasi...", "Verifying..."],
    ["Tampilkan password", "Tampilkan kata sandi", "Show password"],
    ["Nama lengkap *", "Nama lengkap *", "Full Name *"],
    ["Nomor telepon", "Nomor telepon", "Phone Number"],
    [
        "NIK / NRP / identitas",
        "NIK / NRP / identitas",
        "Employee / Service / Identity Number",
    ],
    ["Tanpa unit kerja", "Tanpa unit kerja", "No Department"],
    ["Tanpa unit", "Tanpa unit", "No Unit"],
    ["Tanpa serial", "Tanpa nomor seri", "No Serial Number"],
    ["Tanpa PN", "Tanpa PN", "No Part Number"],
    [
        "Identitas belum dicatat",
        "Identitas belum dicatat",
        "Identity not recorded",
    ],
    ["Welcome", "Selamat Datang", "Welcome"],
    [
        "Tools Asset Management",
        "Manajemen Aset Peralatan",
        "Tools Asset Management",
    ],
    [
        "Workshop Trowulan · Control System",
        "Workshop Trowulan · Sistem Kendali",
        "Workshop Trowulan · Control System",
    ],
    [
        "Inventarisasi, sirkulasi token, inspeksi, dan pemeliharaan dalam satu ruang kendali operasional.",
        "Inventarisasi, sirkulasi token, inspeksi, dan pemeliharaan dalam satu ruang kendali operasional.",
        "Inventory, token circulation, inspections, and maintenance in one operational control center.",
    ],
    [
        "Masuk ke Control Desk",
        "Masuk ke Pusat Kendali",
        "Enter the Control Desk",
    ],
    ["Masuk ke Sistem", "Masuk ke Sistem", "Sign In"],
    [
        "Gunakan akun yang terdaftar untuk mengakses ruang kerja Anda.",
        "Gunakan akun yang terdaftar untuk mengakses ruang kerja Anda.",
        "Use your registered account to access your workspace.",
    ],
    ["Ingat sesi saya", "Ingat sesi saya", "Keep me signed in"],
    ["Profile", "Profil", "Profile"],
    ["Profile Information", "Informasi Profil", "Profile Information"],
    [
        "Update your account's profile information and email address.",
        "Perbarui informasi profil dan alamat surel akun Anda.",
        "Update your account profile information and email address.",
    ],
    ["Update Password", "Perbarui Kata Sandi", "Update Password"],
    ["Current Password", "Kata Sandi Saat Ini", "Current Password"],
    ["New Password", "Kata Sandi Baru", "New Password"],
    ["Confirm Password", "Konfirmasi Kata Sandi", "Confirm Password"],
    [
        "Ensure your account is using a long, random password to stay secure.",
        "Gunakan kata sandi panjang dan acak agar akun tetap aman.",
        "Use a long, random password to keep your account secure.",
    ],
    ["Saved.", "Tersimpan.", "Saved."],
    ["Delete Account", "Hapus Akun", "Delete Account"],
    [
        "Are you sure you want to delete your account?",
        "Anda yakin ingin menghapus akun?",
        "Are you sure you want to delete your account?",
    ],
    [
        "Once your account is deleted, all of its resources and data will be permanently deleted. Before deleting your account, please download any data or information that you wish to retain.",
        "Setelah akun dihapus, seluruh sumber daya dan datanya akan terhapus permanen. Unduh terlebih dahulu data atau informasi yang ingin Anda simpan.",
        "Once your account is deleted, all of its resources and data will be permanently deleted. Download anything you want to keep before continuing.",
    ],
    [
        "Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.",
        "Setelah akun dihapus, seluruh sumber daya dan datanya akan terhapus permanen. Masukkan kata sandi untuk mengonfirmasi penghapusan akun.",
        "Once your account is deleted, all of its resources and data will be permanently deleted. Enter your password to confirm.",
    ],
    ["Password", "Kata Sandi", "Password"],
    ["Log in", "Masuk", "Sign In"],
    ["Log Out", "Keluar", "Sign Out"],
    ["Register", "Daftar", "Create Account"],
    ["Already registered?", "Sudah terdaftar?", "Already have an account?"],
    ["Forgot Password", "Lupa Kata Sandi", "Forgot Password"],
    ["Reset Password", "Atur Ulang Kata Sandi", "Reset Password"],
    [
        "Email Password Reset Link",
        "Kirim Tautan Atur Ulang Kata Sandi",
        "Send Password Reset Link",
    ],
    [
        "Forgot your password? No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.",
        "Lupa kata sandi? Tidak masalah. Masukkan alamat surel Anda dan kami akan mengirim tautan untuk membuat kata sandi baru.",
        "Forgot your password? Enter your email address and we'll send you a link to create a new one.",
    ],
    ["Email Verification", "Verifikasi Surel", "Email Verification"],
    [
        "Resend Verification Email",
        "Kirim Ulang Surel Verifikasi",
        "Resend Verification Email",
    ],
    [
        "Click here to re-send the verification email.",
        "Klik di sini untuk mengirim ulang surel verifikasi.",
        "Click here to resend the verification email.",
    ],
    [
        "Your email address is unverified.",
        "Alamat surel Anda belum diverifikasi.",
        "Your email address is unverified.",
    ],
    [
        "A new verification link has been sent to the email address you provided during registration.",
        "Tautan verifikasi baru telah dikirim ke alamat surel yang Anda gunakan saat mendaftar.",
        "A new verification link has been sent to the email address you provided during registration.",
    ],
    [
        "A new verification link has been sent to your email address.",
        "Tautan verifikasi baru telah dikirim ke alamat surel Anda.",
        "A new verification link has been sent to your email address.",
    ],
    [
        "Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn't receive the email, we will gladly send you another.",
        "Terima kasih telah mendaftar. Sebelum melanjutkan, verifikasi alamat surel melalui tautan yang baru kami kirim. Jika belum menerimanya, kami siap mengirim ulang.",
        "Thanks for signing up. Before continuing, verify your email address using the link we just sent. If it hasn't arrived, we can send another.",
    ],
    [
        "This is a secure area of the application. Please confirm your password before continuing.",
        "Ini adalah area aman aplikasi. Konfirmasikan kata sandi sebelum melanjutkan.",
        "This is a secure area. Confirm your password before continuing.",
    ],
    ["Confirm", "Konfirmasi", "Confirm"],
];

const indexes = {
    id: new Map<string, string>(),
    en: new Map<string, string>(),
};

for (const [source, id, en] of copy) {
    for (const alias of new Set([source, id, en])) {
        indexes.id.set(alias, id);
        indexes.en.set(alias, en);
    }
}

export function getStoredLocale(): Locale {
    if (typeof window === "undefined") return "id";
    return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "id";
}

function translatePart(value: string, locale: Locale): string {
    const exact = indexes[locale].get(value);
    if (exact) return exact;

    const titleSuffix = value.match(/^(.+)( - TAMS)$/);
    if (titleSuffix)
        return translatePart(titleSuffix[1], locale) + titleSuffix[2];

    const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
        [
            /^Selamat datang, (.+)$/,
            (m) =>
                locale === "id"
                    ? `Selamat datang, ${m[1]}`
                    : `Welcome back, ${m[1]}`,
        ],
        [
            /^Tenggat (.+)$/,
            (m) => (locale === "id" ? `Tenggat ${m[1]}` : `Due ${m[1]}`),
        ],
        [
            /^(.+) hari$/,
            (m) => (locale === "id" ? `${m[1]} hari` : `${m[1]} days`),
        ],
        [
            /^(.+) unit$/,
            (m) => (locale === "id" ? `${m[1]} unit` : `${m[1]} units`),
        ],
        [
            /^(.+) Unit$/,
            (m) => (locale === "id" ? `${m[1]} Unit` : `${m[1]} Units`),
        ],
        [
            /^(.+) token$/,
            (m) => (locale === "id" ? `${m[1]} token` : `${m[1]} tokens`),
        ],
        [
            /^(.+) foto bukti$/,
            (m) =>
                locale === "id"
                    ? `${m[1]} foto bukti`
                    : `${m[1]} evidence photos`,
        ],
        [
            /^(.+) unit diterima dari (.+)$/,
            (m) =>
                locale === "id"
                    ? `${m[1]} unit diterima dari ${m[2]}`
                    : `${m[1]} units received from ${m[2]}`,
        ],
        [
            /^(.+) · dibuat (.+)$/,
            (m) =>
                locale === "id"
                    ? `${translatePart(m[1], locale)} · dibuat ${m[2]}`
                    : `${translatePart(m[1], locale)} · created ${m[2]}`,
        ],
        [
            /^Cetak label (.+)$/,
            (m) =>
                locale === "id" ? `Cetak label ${m[1]}` : `Print label ${m[1]}`,
        ],
        [
            /^Akses (.+)$/,
            (m) => (locale === "id" ? `Akses ${m[1]}` : `Access for ${m[1]}`),
        ],
        [
            /^Ubah (.+)$/,
            (m) => (locale === "id" ? `Ubah ${m[1]}` : `Edit ${m[1]}`),
        ],
        [
            /^Hapus (.+)$/,
            (m) => (locale === "id" ? `Hapus ${m[1]}` : `Delete ${m[1]}`),
        ],
        [
            /^(.+) unit diperiksa\.$/,
            (m) =>
                locale === "id"
                    ? `${m[1]} unit diperiksa.`
                    : `${m[1]} units inspected.`,
        ],
        [
            /^(.+) selisih ditemukan\.$/,
            (m) =>
                locale === "id"
                    ? `${m[1]} selisih ditemukan.`
                    : `${m[1]} discrepancies found.`,
        ],
        [
            /^(\d+) DIPILIH$/,
            (m) => (locale === "id" ? `${m[1]} DIPILIH` : `${m[1]} SELECTED`),
        ],
        [
            /^Dipakai oleh (\d+) master aset$/,
            (m) =>
                locale === "id"
                    ? `Dipakai oleh ${m[1]} master aset`
                    : `Used by ${m[1]} asset types`,
        ],
    ];
    for (const [pattern, format] of patterns) {
        const match = value.match(pattern);
        if (match) return format(match);
    }

    if (value.includes(" · ")) {
        return value
            .split(" · ")
            .map((part) => indexes[locale].get(part) ?? part)
            .join(" · ");
    }
    return value;
}

export function translateUiString(value: string, locale: Locale): string {
    const leading = value.match(/^\s*/)?.[0] ?? "";
    const trailing = value.match(/\s*$/)?.[0] ?? "";
    const core = value.trim();
    if (!core) return value;
    return leading + translatePart(core, locale) + trailing;
}

type LocaleContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (value: string) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
    locale: "id",
    setLocale: () => undefined,
    t: (value) => value,
});

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const translatedAttributes = ["placeholder", "title", "aria-label"];

function localizeNode(root: Node, locale: Locale) {
    const texts: Text[] = [];
    if (root.nodeType === Node.TEXT_NODE) texts.push(root as Text);
    if (
        root.nodeType === Node.ELEMENT_NODE ||
        root.nodeType === Node.DOCUMENT_NODE
    ) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) texts.push(node as Text);
    }

    for (const node of texts) {
        const parent = node.parentElement;
        if (
            !parent ||
            parent.closest("[data-no-translate]") ||
            ["SCRIPT", "STYLE"].includes(parent.tagName)
        )
            continue;
        const known = originalText.get(node);
        const current = node.nodeValue ?? "";
        const source =
            known &&
            (current === translateUiString(known, "id") ||
                current === translateUiString(known, "en"))
                ? known
                : current;
        originalText.set(node, source);
        const translated = translateUiString(source, locale);
        if (translated !== current) node.nodeValue = translated;
    }

    const elements: Element[] = [];
    if (root.nodeType === Node.ELEMENT_NODE) elements.push(root as Element);
    if ("querySelectorAll" in root)
        elements.push(...Array.from((root as Element).querySelectorAll("*")));
    for (const element of elements) {
        if (element.closest("[data-no-translate]")) continue;
        let originals = originalAttributes.get(element);
        if (!originals) {
            originals = new Map();
            originalAttributes.set(element, originals);
        }
        for (const attribute of translatedAttributes) {
            const current = element.getAttribute(attribute);
            if (!current) continue;
            const known = originals.get(attribute);
            const source =
                known &&
                (current === translateUiString(known, "id") ||
                    current === translateUiString(known, "en"))
                    ? known
                    : current;
            originals.set(attribute, source);
            const translated = translateUiString(source, locale);
            if (translated !== current)
                element.setAttribute(attribute, translated);
        }
    }
}

export function LocaleProvider({ children }: PropsWithChildren) {
    const [locale, updateLocale] = useState<Locale>(getStoredLocale);

    const setLocale = (next: Locale) => {
        window.localStorage.setItem(STORAGE_KEY, next);
        updateLocale(next);
    };

    useEffect(() => {
        document.documentElement.lang = locale;
        localizeNode(document.body, locale);
        document.title = translateUiString(document.title, locale);
        const observer = new MutationObserver((mutations) => {
            observer.disconnect();
            for (const mutation of mutations) {
                if (
                    mutation.type === "characterData" ||
                    mutation.type === "attributes"
                )
                    localizeNode(mutation.target, locale);
                else
                    for (const node of mutation.addedNodes)
                        localizeNode(node, locale);
            }
            document.title = translateUiString(document.title, locale);
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: translatedAttributes,
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: translatedAttributes,
        });
        return () => observer.disconnect();
    }, [locale]);

    const value = useMemo(
        () => ({
            locale,
            setLocale,
            t: (text: string) => translateUiString(text, locale).trim(),
        }),
        [locale],
    );

    return (
        <LocaleContext.Provider value={value}>
            {children}
        </LocaleContext.Provider>
    );
}

export const useLocale = () => useContext(LocaleContext);
