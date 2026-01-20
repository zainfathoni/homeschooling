import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { prisma } from "~/utils/db.server";
import { requireUser, getActiveStudentId } from "~/utils/permissions.server";
import { AppShell } from "~/components/layout";
import { NarrationList, type SubjectWithNarrations } from "~/components/narration";

export function meta() {
  return [
    { title: "Narrations | Homeschool Planner" },
    { name: "description", content: "View all your learning narrations" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const activeStudentId = await getActiveStudentId(request, user);

  if (!activeStudentId) {
    return {
      subjects: [],
      userRole: user.role,
      students: user.ownedStudents,
      selectedStudentId: null,
    };
  }

  const studentSubjects = await prisma.studentSubject.findMany({
    where: { studentId: activeStudentId },
    include: {
      subject: {
        include: {
          narrations: {
            where: { studentId: activeStudentId },
            orderBy: { date: "desc" },
            take: 10,
          },
        },
      },
    },
    orderBy: { subject: { order: "asc" } },
  });

  const subjects: SubjectWithNarrations[] = studentSubjects.map(
    (ss: (typeof studentSubjects)[number]) => ({
      id: ss.subject.id,
      name: ss.subject.name,
      icon: ss.subject.icon,
      narrations: ss.subject.narrations.map(
        (n: (typeof ss.subject.narrations)[number]) => ({
          id: n.id,
          type: n.type,
          content: n.content,
          date: n.date.toISOString(),
          createdAt: n.createdAt.toISOString(),
        })
      ),
    })
  );

  return {
    subjects,
    userRole: user.role,
    students: user.ownedStudents,
    selectedStudentId: activeStudentId,
  };
}

interface LoaderData {
  subjects: SubjectWithNarrations[];
  userRole: "PARENT" | "STUDENT";
  students: { id: string; name: string }[];
  selectedStudentId: string | null;
}

export default function Narrations() {
  const { subjects, userRole, students, selectedStudentId } =
    useLoaderData<LoaderData>();

  return (
    <AppShell
      userRole={userRole}
      students={students}
      selectedStudentId={selectedStudentId ?? undefined}
    >
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Narrations</h1>
          <p className="text-sm text-gray-500 mt-1">
            All your learning narrations grouped by subject
          </p>
        </div>

        <NarrationList subjects={subjects} showViewAll />
      </div>
    </AppShell>
  );
}
