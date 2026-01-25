import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Enums defined as const arrays for type safety
export const roleEnum = ["PARENT", "STUDENT"] as const;
export const subjectTypeEnum = ["FIXED", "SCHEDULED", "PICK1"] as const;
export const narrationTypeEnum = ["TEXT", "VOICE", "PHOTO"] as const;

// User table
export const users = sqliteTable("User", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: roleEnum }).notNull().default("STUDENT"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Student table
export const students = sqliteTable("Student", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  yearLevel: integer("yearLevel").notNull(),
  parentId: text("parentId")
    .notNull()
    .references(() => users.id),
  userId: text("userId")
    .unique()
    .references(() => users.id),
});

// Subject table
export const subjects = sqliteTable("Subject", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  type: text("type", { enum: subjectTypeEnum }).notNull(),
  scheduledDays: text("scheduledDays"), // JSON: [0,1,2,3,4]
  requiresNarration: integer("requiresNarration", { mode: "boolean" })
    .notNull()
    .default(false),
  order: integer("order").notNull().default(0),
});

// SubjectOption table
export const subjectOptions = sqliteTable("SubjectOption", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subjectId: text("subjectId")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
});

// StudentSubject table (junction table)
export const studentSubjects = sqliteTable("StudentSubject", {
  id: text("id").primaryKey(),
  studentId: text("studentId")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  subjectId: text("subjectId")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
});

// WeeklySchedule table
export const weeklySchedules = sqliteTable("WeeklySchedule", {
  id: text("id").primaryKey(),
  weekStart: integer("weekStart", { mode: "timestamp" }).notNull(),
  studentId: text("studentId")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  schoolDays: text("schoolDays").notNull().default("[0,1,2,3,4]"), // JSON array
});

// ScheduleEntry table
export const scheduleEntries = sqliteTable("ScheduleEntry", {
  id: text("id").primaryKey(),
  scheduleId: text("scheduleId")
    .notNull()
    .references(() => weeklySchedules.id, { onDelete: "cascade" }),
  subjectId: text("subjectId")
    .notNull()
    .references(() => subjects.id),
  selectedOptionId: text("selectedOptionId"),
  completedDays: text("completedDays")
    .notNull()
    .default("[false,false,false,false,false,false,false]"), // JSON array
});

// Narration table
export const narrations = sqliteTable("Narration", {
  id: text("id").primaryKey(),
  studentId: text("studentId")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  subjectId: text("subjectId")
    .notNull()
    .references(() => subjects.id),
  date: integer("date", { mode: "timestamp" }).notNull(),
  type: text("type", { enum: narrationTypeEnum }).notNull(),
  content: text("content").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type SubjectOption = typeof subjectOptions.$inferSelect;
export type NewSubjectOption = typeof subjectOptions.$inferInsert;
export type StudentSubject = typeof studentSubjects.$inferSelect;
export type NewStudentSubject = typeof studentSubjects.$inferInsert;
export type WeeklySchedule = typeof weeklySchedules.$inferSelect;
export type NewWeeklySchedule = typeof weeklySchedules.$inferInsert;
export type ScheduleEntry = typeof scheduleEntries.$inferSelect;
export type NewScheduleEntry = typeof scheduleEntries.$inferInsert;
export type Narration = typeof narrations.$inferSelect;
export type NewNarration = typeof narrations.$inferInsert;

export type Role = (typeof roleEnum)[number];
export type SubjectType = (typeof subjectTypeEnum)[number];
export type NarrationType = (typeof narrationTypeEnum)[number];
