import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { differenceInDays, addDays, startOfDay, endOfDay } from "date-fns";
import { prisma } from "~/utils/db.server";
import { SubjectRow } from "~/components/schedule/SubjectRow";
import { Pick1Selector } from "~/components/schedule/Pick1Selector";
import { WeekNavigation } from "~/components/schedule/WeekNavigation";
import { AppShell } from "~/components/layout";
import { getWeekStart, getCurrentWeekStart } from "~/utils/week";
import {
  requireUser,
  getAccessibleStudentIds,
  getActiveStudentId,
} from "~/utils/permissions.server";

export function meta() {
  return [
    { title: "Weekly Schedule | Homeschool Planner" },
    { name: "description", content: "Weekly planning for homeschool families" },
  ];
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const weekStart = getWeekStart(params.weekStart ?? "");

  const accessibleStudentIds = getAccessibleStudentIds(user);
  const activeStudentId = await getActiveStudentId(request, user);

  if (!activeStudentId || accessibleStudentIds.length === 0) {
    return {
      entries: [],
      weekStart: weekStart.toISOString(),
      todayIndex: null,
      offDays: [5, 6],
      userRole: user.role,
      students: user.ownedStudents,
      selectedStudentId: null,
    };
  }

  const student = await prisma.student.findFirst({
    where: {
      id: activeStudentId,
    },
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
      userRole: user.role,
      students: user.ownedStudents,
      selectedStudentId: null,
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
    userRole: user.role,
    students: user.ownedStudents,
    selectedStudentId: student.id,
  };
}

interface StudentData {
  id: string;
  name: string;
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
  userRole: "PARENT" | "STUDENT";
  students: StudentData[];
  selectedStudentId: string | null;
}

export default function WeekView() {
  const { entries, weekStart, todayIndex, offDays, userRole, students, selectedStudentId } =
    useLoaderData<LoaderData>();

  const weekStartDate = new Date(weekStart);
  const selectedStudentName = students.find((s) => s.id === selectedStudentId)?.name;

  return (
    <AppShell
      userRole={userRole}
      students={students}
      selectedStudentId={selectedStudentId ?? undefined}
    >
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Weekly Schedule</h1>
          {selectedStudentName && userRole === "PARENT" && (
            <span className="text-sm text-gray-500 hidden md:block">
              Viewing: {selectedStudentName}
            </span>
          )}
        </div>

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
      </div>
    </AppShell>
  );
}
