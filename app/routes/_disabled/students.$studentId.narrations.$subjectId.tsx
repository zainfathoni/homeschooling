import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useNavigate, useParams } from "react-router";
import { eq, and, desc } from "drizzle-orm";
import { db } from "~/utils/db.server";
import { subjects, studentSubjects, narrations } from "~/db/schema";
import { NarrationList, type SubjectWithNarrations } from "~/components/narration";

export function meta() {
  return [
    { title: "Subject Narrations | Homeschool Planner" },
    { name: "description", content: "View narrations for a subject" },
  ];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { studentId, subjectId } = params;

  if (!studentId) {
    throw new Response("Student ID required", { status: 400 });
  }

  if (!subjectId) {
    throw new Response("Subject ID required", { status: 400 });
  }

  const studentSubject = await db.query.studentSubjects.findFirst({
    where: and(
      eq(studentSubjects.studentId, studentId),
      eq(studentSubjects.subjectId, subjectId)
    ),
  });

  if (!studentSubject) {
    throw new Response("Subject not found for this student", { status: 404 });
  }

  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.id, subjectId),
    with: {
      narrations: {
        where: eq(narrations.studentId, studentId),
        orderBy: desc(narrations.date),
      },
    },
  });

  if (!subject) {
    throw new Response("Subject not found", { status: 404 });
  }

  const subjectData: SubjectWithNarrations = {
    id: subject.id,
    name: subject.name,
    icon: subject.icon,
    narrations: subject.narrations.map((n) => ({
      id: n.id,
      type: n.type,
      content: n.content,
      date: n.date.toISOString(),
      createdAt: n.createdAt.toISOString(),
    })),
  };

  return { subject: subjectData };
}

interface LoaderData {
  subject: SubjectWithNarrations;
}

export default function StudentSubjectNarrations() {
  const { subject } = useLoaderData<LoaderData>();
  const { studentId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          to={`/students/${studentId}/narrations`}
          onClick={(e) => {
            e.preventDefault();
            navigate(-1);
          }}
          className="text-coral hover:text-coral/80 text-sm font-medium"
        >
          ← Back to all narrations
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          {subject.icon && <span>{subject.icon}</span>}
          {subject.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {subject.narrations.length} narration
          {subject.narrations.length !== 1 ? "s" : ""}
        </p>
      </div>

      <NarrationList subjects={[subject]} showViewAll={false} studentId={studentId} />
    </div>
  );
}
