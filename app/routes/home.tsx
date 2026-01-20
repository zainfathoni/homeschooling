import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { startOfWeek, differenceInDays } from "date-fns";
import { prisma } from "~/utils/db.server";
import { SubjectRow } from "~/components/schedule/SubjectRow";

export function meta() {
  return [
    { title: "Homeschool Planner" },
    { name: "description", content: "Weekly planning for homeschool families" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const weekParam = url.searchParams.get("week");
  const today = new Date();
  const weekStart = weekParam ? new Date(weekParam) : startOfWeek(today, { weekStartsOn: 1 });

  const student = await prisma.student.findFirst({
    include: {
      subjects: {
        include: {
          subject: true,
        },
      },
    },
  });

  if (!student) {
    return { entries: [], weekStart: weekStart.toISOString(), todayIndex: null, offDays: [5, 6] };
  }

  let schedule = await prisma.weeklySchedule.findUnique({
    where: {
      studentId_weekStart: {
        studentId: student.id,
        weekStart,
      },
    },
    include: {
      entries: {
        include: {
          subject: true,
        },
      },
    },
  });

  if (!schedule) {
    schedule = await prisma.weeklySchedule.create({
      data: {
        studentId: student.id,
        weekStart,
        entries: {
          create: student.subjects.map((ss: { subjectId: string }) => ({
            subjectId: ss.subjectId,
          })),
        },
      },
      include: {
        entries: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  const offDays: number[] = JSON.parse(schedule.schoolDays)
    .map((_: number, i: number) => i)
    .filter((i: number) => !JSON.parse(schedule.schoolDays).includes(i));

  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const todayIndex = differenceInDays(today, monday);
  const isCurrentWeek = weekStart.getTime() === monday.getTime();

  interface ScheduleEntryWithSubject {
    id: string;
    completedDays: string;
    subject: { name: string; icon: string | null };
  }

  return {
    entries: schedule.entries.map((entry: ScheduleEntryWithSubject) => ({
      id: entry.id,
      subjectName: entry.subject.name,
      subjectIcon: entry.subject.icon,
      completedDays: JSON.parse(entry.completedDays) as boolean[],
    })),
    weekStart: weekStart.toISOString(),
    todayIndex: isCurrentWeek && todayIndex >= 0 && todayIndex <= 6 ? todayIndex : null,
    offDays,
  };
}

interface LoaderEntry {
  id: string;
  subjectName: string;
  subjectIcon: string | null;
  completedDays: boolean[];
}

interface LoaderData {
  entries: LoaderEntry[];
  weekStart: string;
  todayIndex: number | null;
  offDays: number[];
}

export default function Home() {
  const { entries, todayIndex, offDays } = useLoaderData<LoaderData>();

  return (
    <main className="p-4 md:p-6 max-w-7xl mx-auto bg-lavender min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Weekly Schedule</h1>
      
      {entries.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p>No subjects configured yet.</p>
          <p className="text-sm mt-2">Add students and subjects to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <SubjectRow
              key={entry.id}
              entryId={entry.id}
              subjectName={entry.subjectName}
              subjectIcon={entry.subjectIcon ?? undefined}
              completedDays={entry.completedDays}
              offDays={offDays}
              todayIndex={todayIndex ?? undefined}
            />
          ))}
        </div>
      )}
    </main>
  );
}
