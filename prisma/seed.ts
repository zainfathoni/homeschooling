import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and, notInArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import * as schema from "../app/db/schema";
import * as relations from "../app/db/relations";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load curriculum configuration
interface CurriculumOption {
  id: string;
  name: string;
}

interface CurriculumSubject {
  id: string;
  name: string;
  icon: string;
  type: "FIXED" | "SCHEDULED" | "PICK1";
  requiresNarration?: boolean;
  scheduledDays?: number[];
  order: number;
  options?: CurriculumOption[];
}

interface CurriculumConfig {
  version: string;
  subjects: CurriculumSubject[];
}

const curriculumPath = resolve(__dirname, "curriculum.json");
const curriculum: CurriculumConfig = JSON.parse(
  readFileSync(curriculumPath, "utf-8")
);

const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = connectionString.replace(/^file:/, "");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema: { ...schema, ...relations } });

async function seedSubjects() {
  console.log(`📚 Seeding ${curriculum.subjects.length} subjects from curriculum v${curriculum.version}...`);

  const subjectIds: string[] = [];

  for (const subjectConfig of curriculum.subjects) {
    // Upsert the subject using stable ID
    await db
      .insert(schema.subjects)
      .values({
        id: subjectConfig.id,
        name: subjectConfig.name,
        icon: subjectConfig.icon,
        type: subjectConfig.type,
        requiresNarration: subjectConfig.requiresNarration ?? false,
        scheduledDays: subjectConfig.scheduledDays
          ? JSON.stringify(subjectConfig.scheduledDays)
          : null,
        order: subjectConfig.order,
      })
      .onConflictDoUpdate({
        target: schema.subjects.id,
        set: {
          name: subjectConfig.name,
          icon: subjectConfig.icon,
          type: subjectConfig.type,
          requiresNarration: subjectConfig.requiresNarration ?? false,
          scheduledDays: subjectConfig.scheduledDays
            ? JSON.stringify(subjectConfig.scheduledDays)
            : null,
          order: subjectConfig.order,
        },
      });

    subjectIds.push(subjectConfig.id);

    // Handle PICK1 options
    if (subjectConfig.options && subjectConfig.options.length > 0) {
      const optionIds: string[] = [];

      for (const optionConfig of subjectConfig.options) {
        await db
          .insert(schema.subjectOptions)
          .values({
            id: optionConfig.id,
            name: optionConfig.name,
            subjectId: subjectConfig.id,
          })
          .onConflictDoUpdate({
            target: schema.subjectOptions.id,
            set: {
              name: optionConfig.name,
              subjectId: subjectConfig.id,
            },
          });
        optionIds.push(optionConfig.id);
      }

      // Clean up removed options (options in DB but not in config)
      if (optionIds.length > 0) {
        await db
          .delete(schema.subjectOptions)
          .where(
            and(
              eq(schema.subjectOptions.subjectId, subjectConfig.id),
              notInArray(schema.subjectOptions.id, optionIds)
            )
          );
      }
    }

    console.log(`  ✓ ${subjectConfig.name} (${subjectConfig.type})`);
  }

  return subjectIds;
}

async function seedDemoData(subjectIds: string[]) {
  console.log("\n👥 Seeding demo users and students...");

  // Create parent user (Zain)
  await db
    .insert(schema.users)
    .values({
      id: createId(),
      email: "zain@zavi.family",
      name: "Zain Fathoni",
      role: "PARENT",
    })
    .onConflictDoNothing();

  const parent = await db.query.users.findFirst({
    where: eq(schema.users.email, "zain@zavi.family"),
  });
  if (!parent) throw new Error("Failed to create parent user");
  console.log(`  ✓ Parent: ${parent.name}`);

  // Create student user (Najmi with login)
  await db
    .insert(schema.users)
    .values({
      id: createId(),
      email: "najmi@zavi.family",
      name: "Najmi",
      role: "STUDENT",
    })
    .onConflictDoNothing();

  const najmiUser = await db.query.users.findFirst({
    where: eq(schema.users.email, "najmi@zavi.family"),
  });
  if (!najmiUser) throw new Error("Failed to create Najmi user");
  console.log(`  ✓ Student user: ${najmiUser.name}`);

  // Create student user (Isa with login)
  await db
    .insert(schema.users)
    .values({
      id: createId(),
      email: "isa@zavi.family",
      name: "Isa",
      role: "STUDENT",
    })
    .onConflictDoNothing();

  const isaUser = await db.query.users.findFirst({
    where: eq(schema.users.email, "isa@zavi.family"),
  });
  if (!isaUser) throw new Error("Failed to create Isa user");
  console.log(`  ✓ Student user: ${isaUser.name}`);

  // Create students: Najmi (11) and Isa (8)
  // Check for existing students by finding them
  let najmi = await db.query.students.findFirst({
    where: and(
      eq(schema.students.name, "Najmi"),
      eq(schema.students.parentId, parent.id)
    ),
  });

  if (najmi) {
    await db
      .update(schema.students)
      .set({ userId: najmiUser.id, yearLevel: 11 })
      .where(eq(schema.students.id, najmi.id));
  } else {
    const [newNajmi] = await db
      .insert(schema.students)
      .values({
        id: createId(),
        name: "Najmi",
        yearLevel: 11,
        parentId: parent.id,
        userId: najmiUser.id,
      })
      .returning();
    najmi = newNajmi;
  }
  console.log(`  ✓ Student: ${najmi.name} (Year ${najmi.yearLevel})`);

  let isa = await db.query.students.findFirst({
    where: and(
      eq(schema.students.name, "Isa"),
      eq(schema.students.parentId, parent.id)
    ),
  });

  if (isa) {
    await db
      .update(schema.students)
      .set({ userId: isaUser.id, yearLevel: 8 })
      .where(eq(schema.students.id, isa.id));
  } else {
    const [newIsa] = await db
      .insert(schema.students)
      .values({
        id: createId(),
        name: "Isa",
        yearLevel: 8,
        parentId: parent.id,
        userId: isaUser.id,
      })
      .returning();
    isa = newIsa;
  }
  console.log(`  ✓ Student: ${isa.name} (Year ${isa.yearLevel})`);

  // Link all subjects to both students (idempotent with upsert)
  console.log("\n🔗 Linking subjects to students...");
  for (const student of [najmi, isa]) {
    for (const subjectId of subjectIds) {
      // Check if link exists
      const existing = await db.query.studentSubjects.findFirst({
        where: and(
          eq(schema.studentSubjects.studentId, student.id),
          eq(schema.studentSubjects.subjectId, subjectId)
        ),
      });

      if (!existing) {
        await db.insert(schema.studentSubjects).values({
          id: createId(),
          studentId: student.id,
          subjectId: subjectId,
        });
      }
    }
    console.log(`  ✓ Linked ${subjectIds.length} subjects to ${student.name}`);
  }
}

async function main() {
  console.log("🌱 Seeding database...\n");

  const subjectIds = await seedSubjects();
  await seedDemoData(subjectIds);

  console.log("\n🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    sqlite.close();
  });
