import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useParams } from "react-router";
import { prisma } from "~/utils/db.server";
import { NarrationList, type SubjectWithNarrations } from "~/components/narration";

export function meta() {
  return [
    { title: "Narrations | Homeschool Planner" },
    { name: "description", content: "View all your learning narrations" },
  ];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { studentId } = params;

  if (!studentId) {
    throw new Response("Student ID required", { status: 400 });
  }

  const studentSubjects = await prisma.studentSubject.findMany({
    where: { studentId },
    include: {
      subject: {
        include: {
          narrations: {
            where: { studentId },
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

  return { subjects };
}

interface LoaderData {
  subjects: SubjectWithNarrations[];
}

export default function StudentNarrations() {
  const { subjects } = useLoaderData<LoaderData>();
  const { studentId } = useParams();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Narrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          All your learning narrations grouped by subject
        </p>
      </div>

      <NarrationList subjects={subjects} showViewAll studentId={studentId} />
    </div>
  );
}
