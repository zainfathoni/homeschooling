import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { SubjectType } from "../generated/prisma";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/prisma");

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
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function seedSubjects() {
  console.log(`📚 Seeding ${curriculum.subjects.length} subjects from curriculum v${curriculum.version}...`);

  const subjectIds: string[] = [];

  for (const subjectConfig of curriculum.subjects) {
    // Upsert the subject using stable ID
    const subject = await prisma.subject.upsert({
      where: { id: subjectConfig.id },
      update: {
        name: subjectConfig.name,
        icon: subjectConfig.icon,
        type: SubjectType[subjectConfig.type],
        requiresNarration: subjectConfig.requiresNarration ?? false,
        scheduledDays: subjectConfig.scheduledDays
          ? JSON.stringify(subjectConfig.scheduledDays)
          : null,
        order: subjectConfig.order,
      },
      create: {
        id: subjectConfig.id,
        name: subjectConfig.name,
        icon: subjectConfig.icon,
        type: SubjectType[subjectConfig.type],
        requiresNarration: subjectConfig.requiresNarration ?? false,
        scheduledDays: subjectConfig.scheduledDays
          ? JSON.stringify(subjectConfig.scheduledDays)
          : null,
        order: subjectConfig.order,
      },
    });

    subjectIds.push(subject.id);

    // Handle PICK1 options
    if (subjectConfig.options && subjectConfig.options.length > 0) {
      const optionIds: string[] = [];

      for (const optionConfig of subjectConfig.options) {
        await prisma.subjectOption.upsert({
          where: { id: optionConfig.id },
          update: {
            name: optionConfig.name,
            subjectId: subject.id,
          },
          create: {
            id: optionConfig.id,
            name: optionConfig.name,
            subjectId: subject.id,
          },
        });
        optionIds.push(optionConfig.id);
      }

      // Clean up removed options (options in DB but not in config)
      await prisma.subjectOption.deleteMany({
        where: {
          subjectId: subject.id,
          id: { notIn: optionIds },
        },
      });
    }

    console.log(`  ✓ ${subjectConfig.name} (${subjectConfig.type})`);
  }

  return subjectIds;
}

async function seedDemoData(subjectIds: string[]) {
  console.log("\n👥 Seeding demo users and students...");

  // Create parent user (Zain)
  const parent = await prisma.user.upsert({
    where: { email: "zain@zavi.family" },
    update: {},
    create: {
      email: "zain@zavi.family",
      name: "Zain Fathoni",
      role: "PARENT",
    },
  });
  console.log(`  ✓ Parent: ${parent.name}`);

  // Create student user (Najmi with login)
  const najmiUser = await prisma.user.upsert({
    where: { email: "najmi@zavi.family" },
    update: {},
    create: {
      email: "najmi@zavi.family",
      name: "Najmi",
      role: "STUDENT",
    },
  });
  console.log(`  ✓ Student user: ${najmiUser.name}`);

  // Create student user (Isa with login)
  const isaUser = await prisma.user.upsert({
    where: { email: "isa@zavi.family" },
    update: {},
    create: {
      email: "isa@zavi.family",
      name: "Isa",
      role: "STUDENT",
    },
  });
  console.log(`  ✓ Student user: ${isaUser.name}`);

  // Create students: Najmi (11) and Isa (8)
  // Use findFirst + update/create pattern since Student doesn't have unique name constraint
  const existingNajmi = await prisma.student.findFirst({
    where: { name: "Najmi", parentId: parent.id },
  });
  let najmi;
  if (existingNajmi) {
    najmi = await prisma.student.update({
      where: { id: existingNajmi.id },
      data: { userId: najmiUser.id, yearLevel: 11 },
    });
  } else {
    najmi = await prisma.student.create({
      data: {
        name: "Najmi",
        yearLevel: 11,
        parentId: parent.id,
        userId: najmiUser.id,
      },
    });
  }
  console.log(`  ✓ Student: ${najmi.name} (Year ${najmi.yearLevel})`);

  const existingIsa = await prisma.student.findFirst({
    where: { name: "Isa", parentId: parent.id },
  });
  let isa;
  if (existingIsa) {
    isa = await prisma.student.update({
      where: { id: existingIsa.id },
      data: { userId: isaUser.id, yearLevel: 8 },
    });
  } else {
    isa = await prisma.student.create({
      data: {
        name: "Isa",
        yearLevel: 8,
        parentId: parent.id,
        userId: isaUser.id,
      },
    });
  }
  console.log(`  ✓ Student: ${isa.name} (Year ${isa.yearLevel})`);

  // Link all subjects to both students (idempotent with upsert)
  console.log("\n🔗 Linking subjects to students...");
  for (const student of [najmi, isa]) {
    for (const subjectId of subjectIds) {
      await prisma.studentSubject.upsert({
        where: {
          studentId_subjectId: {
            studentId: student.id,
            subjectId: subjectId,
          },
        },
        update: {},
        create: {
          studentId: student.id,
          subjectId: subjectId,
        },
      });
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
  .finally(async () => {
    await prisma.$disconnect();
  });
