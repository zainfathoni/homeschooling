import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Link, useNavigate, useFetcher } from "react-router";
import { format } from "date-fns";
import { prisma } from "~/utils/db.server";
import {
  requireUser,
  requireNarrationAccess,
} from "~/utils/permissions.server";
import { AppShell } from "~/components/layout";

export function meta() {
  return [
    { title: "View Narration | Homeschool Planner" },
    { name: "description", content: "View your learning narration" },
  ];
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const narrationId = params.id;

  if (!narrationId) {
    throw new Response("Missing narration ID", { status: 400 });
  }

  await requireNarrationAccess(user, narrationId);

  const narration = await prisma.narration.findUnique({
    where: { id: narrationId },
    include: {
      subject: { select: { id: true, name: true, icon: true } },
      student: { select: { name: true } },
    },
  });

  if (!narration) {
    throw new Response("Narration not found", { status: 404 });
  }

  return {
    narration: {
      id: narration.id,
      type: narration.type,
      content: narration.content,
      date: narration.date.toISOString(),
      createdAt: narration.createdAt.toISOString(),
      subject: narration.subject,
      studentName: narration.student.name,
    },
    userRole: user.role,
    students: user.ownedStudents,
    selectedStudentId: narration.studentId,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const narrationId = params.id;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (!narrationId) {
    return new Response("Missing narration ID", { status: 400 });
  }

  await requireNarrationAccess(user, narrationId);

  if (intent === "delete") {
    await prisma.narration.delete({
      where: { id: narrationId },
    });
    return { deleted: true };
  }

  return new Response("Unknown intent", { status: 400 });
}

interface NarrationData {
  id: string;
  type: string;
  content: string;
  date: string;
  createdAt: string;
  subject: { id: string; name: string; icon: string | null };
  studentName: string;
}

interface LoaderData {
  narration: NarrationData;
  userRole: "PARENT" | "STUDENT";
  students: { id: string; name: string }[];
  selectedStudentId: string;
}

export default function ViewNarration() {
  const { narration, userRole, students, selectedStudentId } =
    useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const dateFormatted = format(new Date(narration.date), "EEEE, MMMM d, yyyy");
  const isDeleting = fetcher.state !== "idle";
  const isDeleted = fetcher.data?.deleted;

  if (isDeleted) {
    navigate(-1);
  }

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
              {narration.subject.icon && <span>{narration.subject.icon}</span>}
              {narration.subject.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {dateFormatted} • {narration.studentName}
            </p>
          </div>

          <div className="mb-6">
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-lavender text-gray-600">
              {narration.type.toLowerCase()}
            </span>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{narration.content}</p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <button
                type="submit"
                disabled={isDeleting}
                className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                  isDeleting
                    ? "bg-gray-100 text-gray-400 cursor-wait"
                    : "text-red-600 hover:bg-red-50"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete narration"}
              </button>
            </fetcher.Form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
