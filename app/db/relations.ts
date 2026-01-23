import { relations } from "drizzle-orm";
import {
  users,
  students,
  subjects,
  subjectOptions,
  studentSubjects,
  weeklySchedules,
  scheduleEntries,
  narrations,
} from "./schema";

// User relations
export const usersRelations = relations(users, ({ many, one }) => ({
  // Parent owns students
  ownedStudents: many(students, { relationName: "ParentStudents" }),
  // Student links to their Student record
  studentProfile: one(students, {
    fields: [users.id],
    references: [students.userId],
    relationName: "StudentUser",
  }),
}));

// Student relations
export const studentsRelations = relations(students, ({ one, many }) => ({
  // Parent who owns this student
  parent: one(users, {
    fields: [students.parentId],
    references: [users.id],
    relationName: "ParentStudents",
  }),
  // If student has their own login
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
    relationName: "StudentUser",
  }),
  subjects: many(studentSubjects),
  schedules: many(weeklySchedules),
  narrations: many(narrations),
}));

// Subject relations
export const subjectsRelations = relations(subjects, ({ many }) => ({
  options: many(subjectOptions),
  students: many(studentSubjects),
  entries: many(scheduleEntries),
  narrations: many(narrations),
}));

// SubjectOption relations
export const subjectOptionsRelations = relations(subjectOptions, ({ one }) => ({
  subject: one(subjects, {
    fields: [subjectOptions.subjectId],
    references: [subjects.id],
  }),
}));

// StudentSubject relations
export const studentSubjectsRelations = relations(
  studentSubjects,
  ({ one }) => ({
    student: one(students, {
      fields: [studentSubjects.studentId],
      references: [students.id],
    }),
    subject: one(subjects, {
      fields: [studentSubjects.subjectId],
      references: [subjects.id],
    }),
  })
);

// WeeklySchedule relations
export const weeklySchedulesRelations = relations(
  weeklySchedules,
  ({ one, many }) => ({
    student: one(students, {
      fields: [weeklySchedules.studentId],
      references: [students.id],
    }),
    entries: many(scheduleEntries),
  })
);

// ScheduleEntry relations
export const scheduleEntriesRelations = relations(
  scheduleEntries,
  ({ one }) => ({
    schedule: one(weeklySchedules, {
      fields: [scheduleEntries.scheduleId],
      references: [weeklySchedules.id],
    }),
    subject: one(subjects, {
      fields: [scheduleEntries.subjectId],
      references: [subjects.id],
    }),
  })
);

// Narration relations
export const narrationsRelations = relations(narrations, ({ one }) => ({
  student: one(students, {
    fields: [narrations.studentId],
    references: [students.id],
  }),
  subject: one(subjects, {
    fields: [narrations.subjectId],
    references: [subjects.id],
  }),
}));
