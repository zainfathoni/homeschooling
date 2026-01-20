import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { createRequire } from "module";
import { SubjectType } from "../generated/prisma";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/prisma");

const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create parent user (Zain)
  const parent = await prisma.user.upsert({
    where: { email: "zain@example.com" },
    update: {},
    create: {
      email: "zain@example.com",
      name: "Zain Fathoni",
      role: "PARENT",
    },
  });
  console.log(`✓ Created parent: ${parent.name}`);

  // Create student user (Najmi with login)
  const studentUser = await prisma.user.upsert({
    where: { email: "najmi@example.com" },
    update: {},
    create: {
      email: "najmi@example.com",
      name: "Najmi",
      role: "STUDENT",
    },
  });
  console.log(`✓ Created student user: ${studentUser.name}`);

  // Create students: Najmi (11) and Isa (8)
  // Use raw SQL upsert since Prisma Student model doesn't have a unique field for upsert
  const existingNajmi = await prisma.student.findFirst({
    where: { name: "Najmi", parentId: parent.id },
  });
  let najmi;
  if (existingNajmi) {
    najmi = await prisma.student.update({
      where: { id: existingNajmi.id },
      data: { userId: studentUser.id },
    });
  } else {
    najmi = await prisma.student.create({
      data: {
        name: "Najmi",
        yearLevel: 11,
        parentId: parent.id,
        userId: studentUser.id,
      },
    });
  }
  console.log(`✓ Created student: ${najmi.name} (Year ${najmi.yearLevel})`);

  const existingIsa = await prisma.student.findFirst({
    where: { name: "Isa", parentId: parent.id },
  });
  let isa;
  if (existingIsa) {
    isa = existingIsa;
  } else {
    isa = await prisma.student.create({
      data: {
        name: "Isa",
        yearLevel: 8,
        parentId: parent.id,
      },
    });
  }
  console.log(`✓ Created student: ${isa.name} (Year ${isa.yearLevel})`);

  // Common FIXED subjects (daily)
  const mathSubject = await prisma.subject.create({
    data: {
      name: "Math",
      icon: "📐",
      type: SubjectType.FIXED,
      order: 1,
    },
  });

  const handwritingSubject = await prisma.subject.create({
    data: {
      name: "Handwriting",
      icon: "✍️",
      type: SubjectType.FIXED,
      order: 2,
    },
  });

  const readingSubject = await prisma.subject.create({
    data: {
      name: "Reading",
      icon: "📖",
      type: SubjectType.FIXED,
      requiresNarration: true,
      order: 3,
    },
  });

  const spellingSubject = await prisma.subject.create({
    data: {
      name: "Spelling",
      icon: "🔤",
      type: SubjectType.FIXED,
      order: 4,
    },
  });

  // SCHEDULED subjects (specific days)
  const codingSubject = await prisma.subject.create({
    data: {
      name: "Coding",
      icon: "💻",
      type: SubjectType.SCHEDULED,
      scheduledDays: JSON.stringify([0, 1, 2, 3]), // Mon-Thu
      order: 5,
    },
  });

  const artSubject = await prisma.subject.create({
    data: {
      name: "Art",
      icon: "🎨",
      type: SubjectType.SCHEDULED,
      scheduledDays: JSON.stringify([4]), // Friday
      order: 6,
    },
  });

  const peSubject = await prisma.subject.create({
    data: {
      name: "PE",
      icon: "🏃",
      type: SubjectType.SCHEDULED,
      scheduledDays: JSON.stringify([1, 3]), // Tue, Thu
      order: 7,
    },
  });

  // PICK1 subjects with options
  const islamicStudy = await prisma.subject.create({
    data: {
      name: "Islamic Study",
      icon: "🕌",
      type: SubjectType.PICK1,
      requiresNarration: true,
      order: 8,
      options: {
        create: [
          { name: "Safar Book" },
          { name: "Quran Recitation" },
          { name: "Hadith Study" },
          { name: "Seerah" },
        ],
      },
    },
  });

  const scienceSubject = await prisma.subject.create({
    data: {
      name: "Science",
      icon: "🔬",
      type: SubjectType.PICK1,
      requiresNarration: true,
      order: 9,
      options: {
        create: [
          { name: "Biology" },
          { name: "Chemistry" },
          { name: "Physics" },
          { name: "Nature Study" },
        ],
      },
    },
  });

  const historySubject = await prisma.subject.create({
    data: {
      name: "History",
      icon: "🏛️",
      type: SubjectType.PICK1,
      requiresNarration: true,
      order: 10,
      options: {
        create: [
          { name: "World History" },
          { name: "Islamic History" },
          { name: "Indonesian History" },
        ],
      },
    },
  });

  console.log("✓ Created subjects with options");

  // Link all subjects to both students
  const allSubjects = [
    mathSubject,
    handwritingSubject,
    readingSubject,
    spellingSubject,
    codingSubject,
    artSubject,
    peSubject,
    islamicStudy,
    scienceSubject,
    historySubject,
  ];

  for (const student of [najmi, isa]) {
    for (const subject of allSubjects) {
      await prisma.studentSubject.create({
        data: {
          studentId: student.id,
          subjectId: subject.id,
        },
      });
    }
  }
  console.log(`✓ Linked ${allSubjects.length} subjects to each student`);

  console.log("🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
