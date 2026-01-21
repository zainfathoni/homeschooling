import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useParams } from "react-router";
import { differenceInDays, addDays, startOfDay, endOfDay } from "date-fns";
import { prisma } from "~/utils/db.server";
import { SubjectRow } from "~/components/schedule/SubjectRow";
import { Pick1Selector } from "~/components/schedule/Pick1Selector";
import { WeekNavigation } from "~/components/schedule/WeekNavigation";
import { TabletDuetView } from "~/components/layout";
import { getWeekStart, getCurrentWeekStart } from "~/utils/week";

export function meta() {
  return [
    { title: "Weekly Schedule | Homeschool Planner" },
    { name: "description", content: "Weekly planning for homeschool families" },
  ];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { studentId, weekStart: weekStartParam } = params;

  if (!studentId) {
    throw new Response("Student ID required", { status: 400 });
  }

  const weekStart = getWeekStart(weekStartParam ?? "");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      subjects: {
        include: {
          subject: true,
        },
      },
    },
  });

  if (!student) {
    throw new Response("Student not found", { status: 404 });
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
    subjectId: string;
    completedDays: string;
    selectedOptionId: string | null;
    subject: {
      id: string;
      name: string;
      icon: string | null;
      type: string;
      requiresNarration: boolean;
      options: SubjectOption[];
    };
  }

  const weekEnd = addDays(weekStart, 6);
  const narrations = await prisma.narration.findMany({
    where: {
      studentId: student.id,
      date: {
        gte: startOfDay(weekStart),
        lte: endOfDay(weekEnd),
      },
    },
    select: {
      id: true,
      subjectId: true,
      date: true,
    },
  });

  const narrationsBySubjectAndDay = new Map<string, Map<number, string>>();
  for (const narration of narrations) {
    const dayIndex = differenceInDays(narration.date, weekStart);
    if (dayIndex >= 0 && dayIndex <= 6) {
      if (!narrationsBySubjectAndDay.has(narration.subjectId)) {
        narrationsBySubjectAndDay.set(narration.subjectId, new Map());
      }
      narrationsBySubjectAndDay.get(narration.subjectId)!.set(dayIndex, narration.id);
    }
  }

  return {
    entries: schedule.entries.map((entry: ScheduleEntryWithSubject) => {
      const subjectNarrations = narrationsBySubjectAndDay.get(entry.subjectId);
      const hasNarrationByDay: Record<number, { hasNarration: boolean; narrationId?: string }> = {};
      
      if (entry.subject.requiresNarration) {
        for (let day = 0; day <= 6; day++) {
          const narrationId = subjectNarrations?.get(day);
          hasNarrationByDay[day] = {
            hasNarration: !!narrationId,
            narrationId,
          };
        }
      }

      return {
        id: entry.id,
        subjectId: entry.subjectId,
        subjectName: entry.subject.name,
        subjectIcon: entry.subject.icon,
        subjectType: entry.subject.type,
        requiresNarration: entry.subject.requiresNarration,
        completedDays: JSON.parse(entry.completedDays) as boolean[],
        selectedOptionId: entry.selectedOptionId,
        options: entry.subject.options,
        hasNarrationByDay,
      };
    }),
    weekStart: weekStart.toISOString(),
    todayIndex:
      isCurrentWeek && todayIndex >= 0 && todayIndex <= 6 ? todayIndex : null,
    offDays,
    studentName: student.name,
  };
}

interface Pick1Option {
  id: string;
  name: string;
}

interface LoaderEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectIcon: string | null;
  subjectType: string;
  requiresNarration: boolean;
  completedDays: boolean[];
  selectedOptionId: string | null;
  options: Pick1Option[];
  hasNarrationByDay: Record<number, { hasNarration: boolean; narrationId?: string }>;
}

interface LoaderData {
  entries: LoaderEntry[];
  weekStart: string;
  todayIndex: number | null;
  offDays: number[];
  studentName: string;
}

export default function StudentWeekView() {
  const { entries, weekStart, todayIndex, offDays } = useLoaderData<LoaderData>();
  const { studentId } = useParams();

  const weekStartDate = new Date(weekStart);

  const duetEntries = entries.map((entry) => ({
    entryId: entry.id,
    subjectName: entry.subjectName,
    subjectIcon: entry.subjectIcon ?? undefined,
    completedDays: entry.completedDays,
    requiresNarration: entry.requiresNarration,
    hasNarrationByDay: entry.hasNarrationByDay,
    subjectId: entry.subjectId,
  }));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Weekly Schedule</h1>
      </div>

      <WeekNavigation weekStart={weekStartDate} studentId={studentId} />

      {entries.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p>No subjects configured yet.</p>
          <p className="text-sm mt-2">
            Add students and subjects to get started.
          </p>
        </div>
      ) : (
        <>
          {/* Tablet/Desktop: Duet view with weekly overview + daily focus */}
          <TabletDuetView
            weekStart={weekStartDate}
            entries={duetEntries}
            offDays={offDays}
            studentId={studentId}
          />

          {/* Mobile: Standard subject rows */}
          <div className="space-y-3 md:hidden">
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
        </>
      )}
    </div>
  );
}
