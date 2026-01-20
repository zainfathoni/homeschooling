import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { differenceInDays } from "date-fns";
import { prisma } from "~/utils/db.server";
import { SubjectRow } from "~/components/schedule/SubjectRow";
import { Pick1Selector } from "~/components/schedule/Pick1Selector";
import { WeekNavigation } from "~/components/schedule/WeekNavigation";
import { getWeekStart, getCurrentWeekStart } from "~/utils/week";

export function meta() {
  return [
    { title: "Weekly Schedule | Homeschool Planner" },
    { name: "description", content: "Weekly planning for homeschool families" },
  ];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const weekStart = getWeekStart(params.weekStart ?? "");

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
    return {
      entries: [],
      weekStart: weekStart.toISOString(),
      todayIndex: null,
      offDays: [5, 6],
    };
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
          subject: {
            include: { options: true },
          },
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
            subject: {
              include: { options: true },
            },
          },
        },
      },
    });
  }

  const schoolDaysArray = JSON.parse(schedule.schoolDays) as number[];
  const offDays: number[] = [0, 1, 2, 3, 4, 5, 6].filter(
    (i) => !schoolDaysArray.includes(i)
  );

  const monday = getCurrentWeekStart();
  const today = new Date();
  const todayIndex = differenceInDays(today, monday);
  const isCurrentWeek = weekStart.getTime() === monday.getTime();

  interface SubjectOption {
    id: string;
    name: string;
  }

  interface ScheduleEntryWithSubject {
    id: string;
    completedDays: string;
    selectedOptionId: string | null;
    subject: {
      name: string;
      icon: string | null;
      type: string;
      options: SubjectOption[];
    };
  }

  return {
    entries: schedule.entries.map((entry: ScheduleEntryWithSubject) => ({
      id: entry.id,
      subjectName: entry.subject.name,
      subjectIcon: entry.subject.icon,
      subjectType: entry.subject.type,
      completedDays: JSON.parse(entry.completedDays) as boolean[],
      selectedOptionId: entry.selectedOptionId,
      options: entry.subject.options,
    })),
    weekStart: weekStart.toISOString(),
    todayIndex:
      isCurrentWeek && todayIndex >= 0 && todayIndex <= 6 ? todayIndex : null,
    offDays,
  };
}

interface Pick1Option {
  id: string;
  name: string;
}

interface LoaderEntry {
  id: string;
  subjectName: string;
  subjectIcon: string | null;
  subjectType: string;
  completedDays: boolean[];
  selectedOptionId: string | null;
  options: Pick1Option[];
}

interface LoaderData {
  entries: LoaderEntry[];
  weekStart: string;
  todayIndex: number | null;
  offDays: number[];
}

export default function WeekView() {
  const { entries, weekStart, todayIndex, offDays } =
    useLoaderData<LoaderData>();

  const weekStartDate = new Date(weekStart);

  return (
    <main className="p-4 md:p-6 max-w-7xl mx-auto bg-lavender min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Weekly Schedule</h1>

      <WeekNavigation weekStart={weekStartDate} />

      {entries.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p>No subjects configured yet.</p>
          <p className="text-sm mt-2">
            Add students and subjects to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) =>
            entry.subjectType === "PICK1" ? (
              <Pick1Selector
                key={entry.id}
                entryId={entry.id}
                subjectName={entry.subjectName}
                subjectIcon={entry.subjectIcon ?? undefined}
                options={entry.options}
                selectedOptionId={entry.selectedOptionId}
                completedDays={entry.completedDays}
                offDays={offDays}
                todayIndex={todayIndex ?? undefined}
              />
            ) : (
              <SubjectRow
                key={entry.id}
                entryId={entry.id}
                subjectName={entry.subjectName}
                subjectIcon={entry.subjectIcon ?? undefined}
                completedDays={entry.completedDays}
                offDays={offDays}
                todayIndex={todayIndex ?? undefined}
              />
            )
          )}
        </div>
      )}
    </main>
  );
}
