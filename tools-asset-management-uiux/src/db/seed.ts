import "dotenv/config";
import { db, pool } from "./index";
import {
  users,
  locations,
  categories,
  toolTypes,
  toolUnits,
  loans,
  loanItems,
  maintenanceOrders,
  audits,
  auditItems,
  cases,
  notifications,
} from "./schema";
import { hashPassword } from "../lib/password";

async function main() {
  console.log("Seeding database...");

  // Clean in dependency order
  await db.delete(notifications);
  await db.delete(auditItems);
  await db.delete(audits);
  await db.delete(cases);
  await db.delete(maintenanceOrders);
  await db.delete(loanItems);
  await db.delete(loans);
  await db.delete(toolUnits);
  await db.delete(toolTypes);
  await db.delete(categories);
  await db.delete(locations);
  await db.delete(users);

  const password = "Bengkel#2026";
  const passwordHash = hashPassword(password);

  const [admin, kepala, petugas1, petugas2, user1, user2, user3] = await db
    .insert(users)
    .values([
      {
        name: "Admin Sistem",
        email: "admin@toolsense.id",
        passwordHash,
        role: "admin",
        institution: "TAMS Pusat",
        tokenQuota: 10,
        tokenUsed: 0,
      },
      {
        name: "Rangga Saputra",
        email: "kepala@toolsense.id",
        passwordHash,
        role: "kepala_logistik",
        institution: "Divisi Logistik",
        tokenQuota: 10,
        tokenUsed: 0,
      },
      {
        name: "Dedi Kurniawan",
        email: "petugas1@toolsense.id",
        passwordHash,
        role: "petugas",
        institution: "Tool Room A",
        tokenQuota: 10,
        tokenUsed: 0,
      },
      {
        name: "Siti Amalia",
        email: "petugas2@toolsense.id",
        passwordHash,
        role: "petugas",
        institution: "Tool Room B",
        tokenQuota: 10,
        tokenUsed: 0,
      },
      {
        name: "Budi Hartono",
        email: "user1@toolsense.id",
        passwordHash,
        role: "user",
        institution: "Divisi Konstruksi",
        tokenQuota: 10,
        tokenUsed: 3,
      },
      {
        name: "Maya Anggraini",
        email: "user2@toolsense.id",
        passwordHash,
        role: "user",
        institution: "Divisi Elektrikal",
        tokenQuota: 10,
        tokenUsed: 1,
      },
      {
        name: "Fajar Nugroho",
        email: "user3@toolsense.id",
        passwordHash,
        role: "user",
        institution: "Mitra Lapangan PT Cipta Karya",
        tokenQuota: 8,
        tokenUsed: 2,
      },
    ])
    .returning();

  // ---------- Locations ----------
  const [areaA, areaB, areaLuar] = await db
    .insert(locations)
    .values([
      { name: "Tool Room A", type: "area", capacity: 400 },
      { name: "Tool Room B", type: "area", capacity: 250 },
      { name: "Gudang Luar Area", type: "area", capacity: 60 },
    ])
    .returning();

  const [ruangA1, ruangA2, ruangB1] = await db
    .insert(locations)
    .values([
      { name: "Ruang Alat Tangan", type: "ruang", parentId: areaA.id, capacity: 200 },
      { name: "Ruang Alat Listrik", type: "ruang", parentId: areaA.id, capacity: 150 },
      { name: "Ruang Alat Ukur", type: "ruang", parentId: areaB.id, capacity: 100 },
    ])
    .returning();

  const [rakA1_03, rakA2_01, rakB1_02, rakLuar] = await db
    .insert(locations)
    .values([
      { name: "Rak 03", type: "rak", parentId: ruangA1.id, capacity: 40 },
      { name: "Rak 01", type: "rak", parentId: ruangA2.id, capacity: 30 },
      { name: "Rak 02", type: "rak", parentId: ruangB1.id, capacity: 25 },
      { name: "Rak Titipan", type: "rak", parentId: areaLuar.id, capacity: 20 },
    ])
    .returning();

  const slotRows = await db
    .insert(locations)
    .values([
      { name: "Slot A", type: "slot", parentId: rakA1_03.id, capacity: 8 },
      { name: "Slot B", type: "slot", parentId: rakA1_03.id, capacity: 8 },
      { name: "Slot C", type: "slot", parentId: rakA1_03.id, capacity: 8 },
      { name: "Slot A", type: "slot", parentId: rakA2_01.id, capacity: 6 },
      { name: "Slot B", type: "slot", parentId: rakA2_01.id, capacity: 6 },
      { name: "Slot A", type: "slot", parentId: rakB1_02.id, capacity: 10 },
      { name: "Slot B", type: "slot", parentId: rakB1_02.id, capacity: 10 },
      { name: "Slot A", type: "slot", parentId: rakLuar.id, capacity: 10 },
    ])
    .returning();

  const [slotA1B, slotA1C, slotA2A, slotA2B, slotB1A, slotB1B] = [
    slotRows[1],
    slotRows[2],
    slotRows[3],
    slotRows[4],
    slotRows[5],
    slotRows[6],
  ];

  // ---------- Categories ----------
  const [catTangan, catListrik, catUkur, catAkses, catSafety] = await db
    .insert(categories)
    .values([
      { name: "Alat Tangan", function: "Perakitan & konstruksi manual" },
      { name: "Alat Listrik", function: "Pengerjaan bertenaga listrik" },
      { name: "Alat Ukur", function: "Presisi & kalibrasi" },
      { name: "Akses & Penunjang", function: "Akses kerja tinggi/berat" },
      { name: "K3 / Safety", function: "Alat pelindung diri" },
    ])
    .returning();

  // ---------- Tool types ----------
  const toolTypeData = [
    {
      code: "TWL-DRL",
      name: "Bor Tangan",
      categoryId: catListrik.id,
      size: "Genggam",
      primaryLocationId: rakA2_01.id,
      description: "Bor tangan listrik 13mm dengan reverse dan pengatur kecepatan.",
      rulesSummary: "Wajib checklist mata bor & baterai. Maks pinjam 7 hari.",
      requiresOutsideLetter: true,
    },
    {
      code: "TWL-GRD",
      name: "Gerinda Tangan",
      categoryId: catListrik.id,
      size: "Genggam",
      primaryLocationId: rakA2_01.id,
      description: "Gerinda tangan 4 inci untuk potong dan poles logam.",
      rulesSummary: "Wajib kaca pelindung terpasang. Maks pinjam 5 hari.",
      requiresOutsideLetter: true,
    },
    {
      code: "TWL-TRQ",
      name: "Kunci Torsi",
      categoryId: catUkur.id,
      size: "Sedang",
      primaryLocationId: rakB1_02.id,
      description: "Kunci torsi presisi 10-100 Nm, kalibrasi tahunan.",
      rulesSummary: "Perlu kalibrasi ulang tiap 6 bulan. Tidak untuk luar area.",
      requiresOutsideLetter: false,
    },
    {
      code: "TWL-MLT",
      name: "Multimeter Digital",
      categoryId: catUkur.id,
      size: "Genggam",
      primaryLocationId: rakB1_02.id,
      description: "Multimeter digital true RMS dengan probe lengkap.",
      rulesSummary: "Wajib cek probe & baterai 9V sebelum keluar.",
      requiresOutsideLetter: true,
    },
    {
      code: "TWL-TGA",
      name: "Tangga Aluminium",
      categoryId: catAkses.id,
      size: "Besar (3.5m)",
      primaryLocationId: rakA1_03.id,
      description: "Tangga lipat aluminium tinggi 3.5 meter, kapasitas 150kg.",
      rulesSummary: "Cek kunci pengaman kaki tangga sebelum digunakan.",
      requiresOutsideLetter: true,
    },
    {
      code: "TWL-LAS",
      name: "Mesin Las Inverter",
      categoryId: catListrik.id,
      size: "Sedang",
      primaryLocationId: rakA1_03.id,
      description: "Mesin las inverter 200A untuk pengelasan lapangan.",
      rulesSummary: "Wajib serah terima dengan APD lengkap. Maks pinjam 3 hari.",
      requiresOutsideLetter: true,
    },
    {
      code: "TWL-KMP",
      name: "Kompresor Mini",
      categoryId: catListrik.id,
      size: "Sedang",
      primaryLocationId: rakA1_03.id,
      description: "Kompresor udara mini portable 24L untuk finishing & cat.",
      rulesSummary: "Cek tekanan aman sebelum dan sesudah pemakaian.",
      requiresOutsideLetter: true,
    },
    {
      code: "TWL-LSR",
      name: "Waterpass Laser",
      categoryId: catUkur.id,
      size: "Genggam",
      primaryLocationId: rakB1_02.id,
      description: "Waterpass laser self-leveling jangkauan 30 meter.",
      rulesSummary: "Simpan dalam kotak keras saat transportasi.",
      requiresOutsideLetter: true,
    },
    {
      code: "TWL-HLM",
      name: "Helm Safety",
      categoryId: catSafety.id,
      size: "One size",
      primaryLocationId: rakA1_03.id,
      description: "Helm keselamatan standar SNI dengan tali dagu.",
      rulesSummary: "Wajib dicek retak/keropos setiap pengembalian.",
      requiresOutsideLetter: false,
    },
    {
      code: "TWL-HAR",
      name: "Harness Full Body",
      categoryId: catSafety.id,
      size: "M/L/XL",
      primaryLocationId: rakA1_03.id,
      description: "Harness tubuh penuh untuk pekerjaan ketinggian.",
      rulesSummary: "Wajib inspeksi jahitan & pengait sebelum dipakai.",
      requiresOutsideLetter: true,
    },
  ];

  const insertedTypes = await db.insert(toolTypes).values(toolTypeData).returning();
  const typeByCode = Object.fromEntries(insertedTypes.map((t) => [t.code, t]));

  // ---------- Tool units ----------
  type UnitSeed = {
    code: string;
    status: (typeof toolUnits.$inferInsert)["status"];
    condition: (typeof toolUnits.$inferInsert)["condition"];
    locationId: string | null;
  };

  function buildUnits(prefix: string, count: number, locationId: string, overrides: Partial<UnitSeed>[] = []) {
    const list: UnitSeed[] = [];
    for (let i = 1; i <= count; i++) {
      const code = `${prefix}-2026-${String(i).padStart(4, "0")}`;
      list.push({ code, status: "tersedia", condition: "baik", locationId, ...overrides[i - 1] });
    }
    return list;
  }

  const unitSeeds: { typeCode: string; units: UnitSeed[] }[] = [
    {
      typeCode: "TWL-DRL",
      units: buildUnits("TWL-DRL", 6, slotA2A.id, [
        {},
        { status: "dipinjam" },
        { status: "dipinjam" },
        { status: "perawatan", condition: "perlu_perhatian" },
        {},
        { status: "rusak", condition: "rusak" },
      ]),
    },
    {
      typeCode: "TWL-GRD",
      units: buildUnits("TWL-GRD", 5, slotA2B.id, [{}, { status: "dipinjam" }, {}, {}, { status: "direservasi" }]),
    },
    {
      typeCode: "TWL-TRQ",
      units: buildUnits("TWL-TRQ", 4, slotB1A.id, [{}, {}, { status: "dipinjam" }, {}]),
    },
    {
      typeCode: "TWL-MLT",
      units: buildUnits("TWL-MLT", 6, slotB1B.id, [{}, {}, { status: "dipinjam" }, {}, { status: "hilang", condition: "hilang" }, {}]),
    },
    {
      typeCode: "TWL-TGA",
      units: buildUnits("TWL-TGA", 4, slotA1B.id, [{}, { status: "dipinjam" }, {}, {}]),
    },
    {
      typeCode: "TWL-LAS",
      units: buildUnits("TWL-LAS", 3, slotA1C.id, [{ status: "dipinjam" }, {}, { status: "perawatan", condition: "perlu_perhatian" }]),
    },
    {
      typeCode: "TWL-KMP",
      units: buildUnits("TWL-KMP", 3, slotA1C.id, [{}, { status: "dipinjam" }, {}]),
    },
    {
      typeCode: "TWL-LSR",
      units: buildUnits("TWL-LSR", 4, slotB1B.id, [{}, {}, { status: "dipinjam" }, {}]),
    },
    {
      typeCode: "TWL-HLM",
      units: buildUnits("TWL-HLM", 10, slotA1B.id, [{}, {}, {}, {}, {}, {}, { status: "dipinjam" }, { status: "dipinjam" }, {}, {}]),
    },
    {
      typeCode: "TWL-HAR",
      units: buildUnits("TWL-HAR", 6, slotA1B.id, [{}, { status: "dipinjam" }, {}, {}, { status: "rusak", condition: "rusak" }, {}]),
    },
  ];

  const allUnits: (typeof toolUnits.$inferSelect)[] = [];
  for (const group of unitSeeds) {
    const type = typeByCode[group.typeCode];
    const rows = await db
      .insert(toolUnits)
      .values(
        group.units.map((u) => ({
          toolTypeId: type.id,
          assetCode: u.code,
          serialNumber: `SN-${u.code}`,
          status: u.status,
          condition: u.condition,
          locationId: u.locationId,
          owner: "TAMS Pusat",
        }))
      )
      .returning();
    allUnits.push(...rows);
  }

  const unitByCode = Object.fromEntries(allUnits.map((u) => [u.assetCode, u]));

  // ---------- Loans ----------
  const now = new Date();
  function daysFromNow(n: number) {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d;
  }

  const [loan1, loan2, loan3, loan4, loan5, loan6] = await db
    .insert(loans)
    .values([
      {
        trxNo: "TRX-1042",
        userId: user1.id,
        usageType: "dalam_area",
        purpose: "Pemasangan rak gudang B",
        locationText: "Gudang B - Lantai 2",
        startDate: daysFromNow(-2),
        dueDate: daysFromNow(1),
        status: "berjalan",
        tokensUsed: 2,
        handoverAt: daysFromNow(-2),
      },
      {
        trxNo: "TRX-1031",
        userId: user2.id,
        usageType: "dalam_area",
        purpose: "Pengecekan instalasi listrik panel C",
        locationText: "Panel Listrik Gedung C",
        startDate: daysFromNow(-5),
        dueDate: daysFromNow(-1),
        status: "menunggu_inspeksi",
        tokensUsed: 1,
        handoverAt: daysFromNow(-5),
      },
      {
        trxNo: "TRX-1058",
        userId: user3.id,
        usageType: "luar_area",
        purpose: "Renovasi kantor cabang Bekasi",
        locationText: "Kantor Cabang Bekasi",
        startDate: daysFromNow(1),
        dueDate: daysFromNow(10),
        status: "menunggu_approval",
        letterUrl: "/uploads/surat-tugas-bekasi.pdf",
        tokensUsed: 2,
      },
      {
        trxNo: "TRX-0998",
        userId: user1.id,
        usageType: "dalam_area",
        purpose: "Pemeliharaan tangga darurat",
        locationText: "Gedung A - Tangga Darurat",
        startDate: daysFromNow(-10),
        dueDate: daysFromNow(-6),
        status: "terlambat",
        tokensUsed: 1,
        handoverAt: daysFromNow(-10),
      },
      {
        trxNo: "TRX-0975",
        userId: user2.id,
        usageType: "luar_area",
        purpose: "Survey lokasi proyek Karawang",
        locationText: "Proyek Karawang",
        startDate: daysFromNow(-20),
        dueDate: daysFromNow(-13),
        status: "selesai",
        tokensUsed: 1,
        handoverAt: daysFromNow(-20),
        returnedAt: daysFromNow(-12),
        approvedById: kepala.id,
        approvedAt: daysFromNow(-21),
        letterUrl: "/uploads/surat-tugas-karawang.pdf",
      },
      {
        trxNo: "TRX-1067",
        userId: user3.id,
        usageType: "luar_area",
        purpose: "Perbaikan darurat listrik mitra",
        locationText: "Workshop Mitra Cikarang",
        startDate: daysFromNow(2),
        dueDate: daysFromNow(9),
        status: "disetujui",
        tokensUsed: 1,
        approvedById: kepala.id,
        approvedAt: daysFromNow(-1),
        letterUrl: "/uploads/surat-tugas-cikarang.pdf",
      },
    ])
    .returning();

  await db.insert(loanItems).values([
    {
      loanId: loan1.id,
      toolTypeId: typeByCode["TWL-DRL"].id,
      unitId: unitByCode["TWL-DRL-2026-0002"].id,
      conditionOut: "baik",
      checklist: { baterai: true, charger: true, kotak: true, buku_panduan: false },
    },
    {
      loanId: loan1.id,
      toolTypeId: typeByCode["TWL-HLM"].id,
      unitId: unitByCode["TWL-HLM-2026-0007"].id,
      conditionOut: "baik",
      checklist: { tali_dagu: true },
    },
    {
      loanId: loan2.id,
      toolTypeId: typeByCode["TWL-MLT"].id,
      unitId: unitByCode["TWL-MLT-2026-0003"].id,
      conditionOut: "baik",
      returnStatus: "belum_dicek",
      checklist: { probe: true, baterai_9v: true, kotak: true },
    },
    {
      loanId: loan3.id,
      toolTypeId: typeByCode["TWL-TGA"].id,
      conditionOut: "baik",
    },
    {
      loanId: loan3.id,
      toolTypeId: typeByCode["TWL-HAR"].id,
      conditionOut: "baik",
    },
    {
      loanId: loan4.id,
      toolTypeId: typeByCode["TWL-TGA"].id,
      unitId: unitByCode["TWL-TGA-2026-0002"].id,
      conditionOut: "baik",
    },
    {
      loanId: loan5.id,
      toolTypeId: typeByCode["TWL-LSR"].id,
      unitId: unitByCode["TWL-LSR-2026-0003"].id,
      conditionOut: "baik",
      conditionIn: "baik",
      returnStatus: "sesuai",
      checklist: { kotak_keras: true, kabel: true },
    },
    {
      loanId: loan6.id,
      toolTypeId: typeByCode["TWL-GRD"].id,
      conditionOut: "baik",
    },
  ]);

  // ---------- Maintenance orders ----------
  await db.insert(maintenanceOrders).values([
    {
      workOrderNo: "WO-2026-014",
      unitId: unitByCode["TWL-DRL-2026-0004"].id,
      action: "Servis motor & ganti sikat karbon",
      technician: "Agus Setiawan",
      status: "berjalan",
      scheduledDate: daysFromNow(-1),
      notes: "Motor bor berbunyi kasar saat RPM tinggi.",
    },
    {
      workOrderNo: "WO-2026-015",
      unitId: unitByCode["TWL-LAS-2026-0003"].id,
      action: "Kalibrasi arus & ganti kipas pendingin",
      vendor: "CV Sumber Teknik",
      status: "dijadwalkan",
      scheduledDate: daysFromNow(3),
      notes: "Overheat saat pemakaian lebih dari 30 menit.",
    },
    {
      workOrderNo: "WO-2026-009",
      unitId: unitByCode["TWL-DRL-2026-0006"].id,
      action: "Penggantian gearbox",
      technician: "Agus Setiawan",
      status: "selesai",
      scheduledDate: daysFromNow(-15),
      completedDate: daysFromNow(-12),
      cost: "450000",
      nextScheduleDate: daysFromNow(150),
    },
    {
      workOrderNo: "WO-2026-002",
      unitId: unitByCode["TWL-HAR-2026-0005"].id,
      action: "Inspeksi jahitan & pengait tahunan",
      technician: "Dedi Kurniawan",
      status: "terlambat",
      scheduledDate: daysFromNow(-4),
      notes: "Ditemukan jahitan aus pada bagian pinggang.",
    },
  ]);

  // ---------- Audits ----------
  const [auditRunning] = await db
    .insert(audits)
    .values([
      {
        name: "Audit Semester II - Tool Room A",
        scope: "Tool Room A (Alat Tangan & Listrik)",
        status: "berjalan",
        assignedTo: "Dedi Kurniawan",
        scheduledDate: daysFromNow(0),
        totalUnits: 200,
        checkedUnits: 148,
      },
      {
        name: "Audit Triwulan I - Alat Ukur",
        scope: "Tool Room B (Alat Ukur)",
        status: "draf",
        assignedTo: "Siti Amalia",
        scheduledDate: daysFromNow(7),
        totalUnits: 14,
        checkedUnits: 0,
      },
    ])
    .returning();

  await db.insert(auditItems).values([
    {
      auditId: auditRunning.id,
      unitId: unitByCode["TWL-DRL-2026-0001"].id,
      expectedLocationId: slotA2A.id,
      actualLocationId: slotA2A.id,
      condition: "baik",
      status: "sesuai",
      scannedAt: daysFromNow(0),
    },
    {
      auditId: auditRunning.id,
      unitId: unitByCode["TWL-GRD-2026-0003"].id,
      expectedLocationId: slotA2B.id,
      actualLocationId: rakA1_03.id,
      condition: "baik",
      status: "selisih_lokasi",
      note: "Ditemukan di Rak 03, bukan di Slot B.",
      scannedAt: daysFromNow(0),
    },
    {
      auditId: auditRunning.id,
      unitId: unitByCode["TWL-MLT-2026-0005"].id,
      expectedLocationId: slotB1B.id,
      actualLocationId: null,
      condition: "hilang",
      status: "hilang",
      note: "Tidak ditemukan pada rak maupun catatan peminjaman aktif.",
      scannedAt: daysFromNow(0),
    },
    {
      auditId: auditRunning.id,
      unitId: unitByCode["TWL-HLM-2026-0003"].id,
      expectedLocationId: slotA1B.id,
      actualLocationId: null,
      condition: null,
      status: "belum_discan",
    },
  ]);

  // ---------- Cases ----------
  await db.insert(cases).values([
    {
      caseNo: "KSS-2026-005",
      type: "hilang",
      stage: "investigasi",
      unitId: unitByCode["TWL-MLT-2026-0005"].id,
      responsibleUserId: user2.id,
      chronology:
        "Unit tidak ditemukan saat audit stok Tool Room B. Peminjam terakhir belum mengonfirmasi lokasi penyimpanan.",
      hasChronology: true,
      hasEvidence: true,
      hasBeritaAcara: false,
      hasDecision: false,
    },
    {
      caseNo: "KSS-2026-003",
      type: "rusak",
      stage: "berita_acara",
      unitId: unitByCode["TWL-DRL-2026-0006"].id,
      loanId: loan4.id,
      responsibleUserId: user1.id,
      chronology: "Bor tangan terjatuh dari ketinggian 2 meter saat pemasangan rak, casing retak dan motor tidak menyala.",
      hasChronology: true,
      hasEvidence: true,
      hasBeritaAcara: true,
      hasDecision: false,
    },
    {
      caseNo: "KSS-2025-041",
      type: "rusak",
      stage: "selesai",
      unitId: unitByCode["TWL-HAR-2026-0005"].id,
      responsibleUserId: user3.id,
      chronology: "Jahitan harness aus akibat pemakaian intensif melebihi batas rekomendasi pabrik.",
      decision: "Unit ditarik dari sirkulasi dan diganti dengan unit baru TWL-HAR-2026-0007.",
      hasChronology: true,
      hasEvidence: true,
      hasBeritaAcara: true,
      hasDecision: true,
    },
  ]);

  // ---------- Notifications ----------
  await db.insert(notifications).values([
    {
      userId: user1.id,
      category: "perlu_tindakan",
      title: "Pengembalian TRX-1042 jatuh tempo besok",
      description: "Bor Tangan & Helm Safety harus dikembalikan sebelum " + daysFromNow(1).toLocaleDateString("id-ID"),
      objectType: "loan",
      objectId: loan1.id,
      href: `/peminjaman/${loan1.id}`,
    },
    {
      userId: user3.id,
      category: "informasi",
      title: "Permohonan luar area menunggu persetujuan",
      description: "TRX-1058 sedang ditinjau oleh Kepala Logistik.",
      objectType: "loan",
      objectId: loan3.id,
      href: `/peminjaman/${loan3.id}`,
    },
    {
      userId: kepala.id,
      category: "perlu_tindakan",
      title: "1 permohonan luar area menunggu persetujuan",
      description: "TRX-1058 · Fajar Nugroho · Renovasi kantor cabang Bekasi",
      objectType: "loan",
      objectId: loan3.id,
      href: `/approval/${loan3.id}`,
    },
    {
      userId: petugas1.id,
      category: "perlu_tindakan",
      title: "Inspeksi pengembalian TRX-1031 menunggu",
      description: "Multimeter Digital perlu diperiksa sebelum ditutup.",
      objectType: "loan",
      objectId: loan2.id,
      href: `/pengembalian/${loan2.id}`,
    },
    {
      userId: petugas1.id,
      category: "perlu_tindakan",
      title: "TRX-0998 terlambat 6 hari",
      description: "Budi Hartono belum mengembalikan Tangga Aluminium.",
      objectType: "loan",
      objectId: loan4.id,
      href: `/peminjaman/${loan4.id}`,
    },
    {
      userId: user2.id,
      category: "selesai",
      title: "Pengembalian TRX-0975 selesai",
      description: "Waterpass Laser telah dikonfirmasi sesuai kondisi.",
      objectType: "loan",
      objectId: loan5.id,
      href: `/peminjaman/${loan5.id}`,
      readAt: daysFromNow(-11),
    },
  ]);

  console.log("Seed selesai.");
  console.log("Akun demo (password sama untuk semua): Bengkel#2026");
  console.log([admin, kepala, petugas1, petugas2, user1, user2, user3].map((u) => u.email).join("\n"));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
