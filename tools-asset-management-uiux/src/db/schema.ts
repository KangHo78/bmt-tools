import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  serial,
  uuid,
  numeric,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const roleEnum = pgEnum("role", [
  "user",
  "petugas",
  "kepala_logistik",
  "admin",
]);

export const usageTypeEnum = pgEnum("usage_type", ["dalam_area", "luar_area"]);

export const loanStatusEnum = pgEnum("loan_status", [
  "menunggu_approval",
  "ditolak",
  "disetujui",
  "menunggu_serah_terima",
  "berjalan",
  "menunggu_inspeksi",
  "selesai",
  "terlambat",
]);

export const unitStatusEnum = pgEnum("unit_status", [
  "tersedia",
  "direservasi",
  "dipinjam",
  "perawatan",
  "rusak",
  "hilang",
]);

export const unitConditionEnum = pgEnum("unit_condition", [
  "baik",
  "perlu_perhatian",
  "rusak",
  "hilang",
]);

export const returnStatusEnum = pgEnum("return_status", [
  "belum_dicek",
  "sesuai",
  "rusak",
  "tidak_lengkap",
  "hilang",
]);

export const locationTypeEnum = pgEnum("location_type", [
  "area",
  "ruang",
  "rak",
  "slot",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "dijadwalkan",
  "berjalan",
  "selesai",
  "terlambat",
]);

export const auditStatusEnum = pgEnum("audit_status", [
  "draf",
  "berjalan",
  "rekonsiliasi",
  "selesai",
]);

export const auditItemStatusEnum = pgEnum("audit_item_status", [
  "belum_discan",
  "sesuai",
  "selisih_lokasi",
  "kondisi_berbeda",
  "hilang",
]);

export const caseTypeEnum = pgEnum("case_type", ["rusak", "hilang"]);

export const caseStageEnum = pgEnum("case_stage", [
  "dilaporkan",
  "investigasi",
  "berita_acara",
  "keputusan",
  "selesai",
]);

export const notificationCategoryEnum = pgEnum("notification_category", [
  "perlu_tindakan",
  "informasi",
  "selesai",
]);

// ---------- Core tables ----------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("user"),
  institution: text("institution"),
  phone: text("phone"),
  tokenQuota: integer("token_quota").notNull().default(10),
  tokenUsed: integer("token_used").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: locationTypeEnum("type").notNull(),
  parentId: uuid("parent_id"),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  function: text("function"),
});

export const toolTypes = pgTable("tool_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  size: text("size"),
  primaryLocationId: uuid("primary_location_id").references(() => locations.id),
  description: text("description"),
  rulesSummary: text("rules_summary"),
  imageUrl: text("image_url"),
  requiresOutsideLetter: boolean("requires_outside_letter").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const toolUnits = pgTable("tool_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolTypeId: uuid("tool_type_id")
    .notNull()
    .references(() => toolTypes.id),
  assetCode: text("asset_code").notNull().unique(),
  serialNumber: text("serial_number"),
  status: unitStatusEnum("status").notNull().default("tersedia"),
  condition: unitConditionEnum("condition").notNull().default("baik"),
  locationId: uuid("location_id").references(() => locations.id),
  owner: text("owner"),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  trxNo: text("trx_no").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  usageType: usageTypeEnum("usage_type").notNull().default("dalam_area"),
  purpose: text("purpose").notNull(),
  locationText: text("location_text").notNull(),
  startDate: timestamp("start_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: loanStatusEnum("status").notNull().default("menunggu_approval"),
  letterUrl: text("letter_url"),
  approvedById: uuid("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  tokensUsed: integer("tokens_used").notNull().default(0),
  handoverAt: timestamp("handover_at"),
  handoverPhotoUrl: text("handover_photo_url"),
  returnedAt: timestamp("returned_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const loanItems = pgTable("loan_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id")
    .notNull()
    .references(() => loans.id),
  toolTypeId: uuid("tool_type_id")
    .notNull()
    .references(() => toolTypes.id),
  unitId: uuid("unit_id").references(() => toolUnits.id),
  conditionOut: unitConditionEnum("condition_out"),
  conditionIn: unitConditionEnum("condition_in"),
  returnStatus: returnStatusEnum("return_status").notNull().default("belum_dicek"),
  checklist: jsonb("checklist").$type<Record<string, boolean>>(),
  returnNote: text("return_note"),
  photosOut: jsonb("photos_out").$type<string[]>().default([]),
  photosIn: jsonb("photos_in").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const maintenanceOrders = pgTable("maintenance_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  workOrderNo: text("work_order_no").notNull().unique(),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => toolUnits.id),
  action: text("action").notNull(),
  technician: text("technician"),
  vendor: text("vendor"),
  status: maintenanceStatusEnum("status").notNull().default("dijadwalkan"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedDate: timestamp("completed_date"),
  cost: numeric("cost"),
  notes: text("notes"),
  beforePhotoUrl: text("before_photo_url"),
  afterPhotoUrl: text("after_photo_url"),
  nextScheduleDate: timestamp("next_schedule_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const audits = pgTable("audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  scope: text("scope").notNull(),
  status: auditStatusEnum("status").notNull().default("draf"),
  assignedTo: text("assigned_to"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  totalUnits: integer("total_units").notNull().default(0),
  checkedUnits: integer("checked_units").notNull().default(0),
  reviewerNote: text("reviewer_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditItems = pgTable("audit_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  auditId: uuid("audit_id")
    .notNull()
    .references(() => audits.id),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => toolUnits.id),
  expectedLocationId: uuid("expected_location_id").references(() => locations.id),
  actualLocationId: uuid("actual_location_id").references(() => locations.id),
  condition: unitConditionEnum("condition"),
  status: auditItemStatusEnum("status").notNull().default("belum_discan"),
  note: text("note"),
  scannedAt: timestamp("scanned_at"),
});

export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseNo: text("case_no").notNull().unique(),
  type: caseTypeEnum("type").notNull(),
  stage: caseStageEnum("stage").notNull().default("dilaporkan"),
  unitId: uuid("unit_id").references(() => toolUnits.id),
  loanId: uuid("loan_id").references(() => loans.id),
  responsibleUserId: uuid("responsible_user_id").references(() => users.id),
  chronology: text("chronology").notNull(),
  decision: text("decision"),
  replacementUnitId: uuid("replacement_unit_id").references(() => toolUnits.id),
  hasChronology: boolean("has_chronology").notNull().default(true),
  hasEvidence: boolean("has_evidence").notNull().default(false),
  hasBeritaAcara: boolean("has_berita_acara").notNull().default(false),
  hasDecision: boolean("has_decision").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  category: notificationCategoryEnum("category").notNull().default("informasi"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  objectType: text("object_type"),
  objectId: text("object_id"),
  href: text("href"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});
