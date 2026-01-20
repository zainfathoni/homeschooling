import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useNavigate, useSearchParams } from "react-router";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { prisma } from "~/utils/db.server";
import { requireUser, getActiveStudentId } from "~/utils/permissions.server";
import { AppShell } from "~/components/layout";
import { TextInput, VoiceRecorder } from "~/components/narration";

export function meta() {
  return [
    { title: "Add Narration | Homeschool Planner" },
    { name: "description", content: "Add a narration for your learning" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const subjectId = url.searchParams.get("subjectId");
  const dateStr = url.searchParams.get("date");

  if (!subjectId || !dateStr) {
    throw new Response("Missing subjectId or date", { status: 400 });
  }

  const activeStudentId = await getActiveStudentId(request, user);
  if (!activeStudentId) {
    throw new Response("No student selected", { status: 400 });
  }

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true, name: true, icon: true },
  });

  if (!subject) {
    throw new Response("Subject not found", { status: 404 });
  }

  return {
    subject,
    date: dateStr,
    studentId: activeStudentId,
    userRole: user.role,
    students: user.ownedStudents,
    selectedStudentId: activeStudentId,
  };
}

interface LoaderData {
  subject: { id: string; name: string; icon: string | null };
  date: string;
  studentId: string;
  userRole: "PARENT" | "STUDENT";
  students: { id: string; name: string }[];
  selectedStudentId: string;
}

type NarrationTab = "text" | "voice";

export default function NewNarration() {
  const { subject, date, userRole, students, selectedStudentId } =
    useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("type") as NarrationTab) || "text";
  const [activeTab, setActiveTab] = useState<NarrationTab>(initialTab);

  const dateFormatted = format(parseISO(date), "EEEE, MMMM d, yyyy");

  const handleSaved = () => {
    navigate(-1);
  };

  return (
    <AppShell
      userRole={userRole}
      students={students}
      selectedStudentId={selectedStudentId}
    >
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            to=".."
            onClick={(e) => {
              e.preventDefault();
              navigate(-1);
            }}
            className="text-coral hover:text-coral/80 text-sm font-medium"
          >
            ← Back
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              {subject.icon && <span>{subject.icon}</span>}
              Add Narration
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {subject.name} • {dateFormatted}
            </p>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("text")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
                activeTab === "text"
                  ? "border-coral text-coral"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              ✏️ Text
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("voice")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
                activeTab === "voice"
                  ? "border-coral text-coral"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              🎤 Voice
            </button>
          </div>

          {activeTab === "text" ? (
            <TextInput
              subjectId={subject.id}
              date={date}
              subjectName={subject.name}
              onSaved={handleSaved}
            />
          ) : (
            <VoiceRecorder
              subjectId={subject.id}
              date={date}
              subjectName={subject.name}
              onSaved={handleSaved}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
