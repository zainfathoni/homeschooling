import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useParams } from "react-router";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "~/utils/db.server";
import { studentSubjects, narrations } from "~/db/schema";
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

  const studentSubjectRecords = await db.query.studentSubjects.findMany({
    where: eq(studentSubjects.studentId, studentId),
    with: {
      subject: {
        with: {
          narrations: {
            where: eq(narrations.studentId, studentId),
            orderBy: desc(narrations.date),
            limit: 10,
          },
        },
      },
    },
    orderBy: asc(studentSubjects.id),
  });

  // Sort by subject order
  studentSubjectRecords.sort((a, b) => a.subject.order - b.subject.order);

  const subjects: SubjectWithNarrations[] = studentSubjectRecords.map((ss) => ({
    id: ss.subject.id,
    name: ss.subject.name,
    icon: ss.subject.icon,
    narrations: ss.subject.narrations.map((n) => ({
      id: n.id,
      type: n.type,
      content: n.content,
      date: n.date.toISOString(),
      createdAt: n.createdAt.toISOString(),
    })),
  }));

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
