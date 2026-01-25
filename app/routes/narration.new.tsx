import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useNavigate, useSearchParams } from "react-router";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { eq } from "drizzle-orm";
import { db } from "~/utils/db.server";
import { subjects } from "~/db/schema";
import { requireUser, getActiveStudentId } from "~/utils/permissions.server";
import { AppShell } from "~/components/layout";
import { TextInput, VoiceRecorder, PhotoCapture } from "~/components/narration";

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

  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.id, subjectId),
    columns: { id: true, name: true, icon: true },
  });

  if (!subject) {
    throw new Response("Subject not found", { status: 404 });
  }

  return {
    subject,
    date: dateStr,
    selectedStudentId: activeStudentId,
  };
}

interface LoaderData {
  subject: { id: string; name: string; icon: string | null };
  date: string;
  selectedStudentId: string;
}

type NarrationTab = "text" | "voice" | "photo";

export default function NewNarration() {
  const { subject, date, selectedStudentId } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("type") as NarrationTab) || "text";
  const [activeTab, setActiveTab] = useState<NarrationTab>(initialTab);

  const dateFormatted = format(parseISO(date), "EEEE, MMMM d, yyyy");

  const handleSaved = () => {
    navigate(-1);
  };

  return (
    <AppShell selectedStudentId={selectedStudentId}>
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
            <h1 className="text-xl font-semibold text-dark-gray flex items-center gap-2">
              {subject.icon && <span>{subject.icon}</span>}
              Add Narration
            </h1>
            <p className="text-sm text-medium-gray mt-1">
              {subject.name} • {dateFormatted}
            </p>
          </div>

          <div className="flex border-b border-light-gray mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("text")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
                activeTab === "text"
                  ? "border-coral text-coral"
                  : "border-transparent text-medium-gray hover:text-dark-gray"
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
                  : "border-transparent text-medium-gray hover:text-dark-gray"
              }`}
            >
              🎤 Voice
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("photo")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
                activeTab === "photo"
                  ? "border-coral text-coral"
                  : "border-transparent text-medium-gray hover:text-dark-gray"
              }`}
            >
              📷 Photo
            </button>
          </div>

          {activeTab === "text" && (
            <TextInput
              subjectId={subject.id}
              date={date}
              subjectName={subject.name}
              onSaved={handleSaved}
            />
          )}
          {activeTab === "voice" && (
            <VoiceRecorder
              subjectId={subject.id}
              date={date}
              subjectName={subject.name}
              onSaved={handleSaved}
            />
          )}
          {activeTab === "photo" && (
            <PhotoCapture
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
