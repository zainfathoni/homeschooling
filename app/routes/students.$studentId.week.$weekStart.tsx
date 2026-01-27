import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useParams } from "react-router";
import { differenceInDays, addDays, startOfDay, endOfDay } from "date-fns";
import { createId } from "@paralleldrive/cuid2";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "~/utils/db.server";
import { students, weeklySchedules, scheduleEntries, narrations } from "~/db/schema";
import { SubjectRow } from "~/components/schedule/SubjectRow";
import { Pick1Selector } from "~/components/schedule/Pick1Selector";
import { TabletDuetView, type DuetEntry } from "~/components/schedule/TabletDuetView";
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

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
    with: {
      subjects: {
        with: {
          subject: true,
        },
      },
    },
  });

  if (!student) {
    throw new Response("Student not found", { status: 404 });
  }

  let schedule = await db.query.weeklySchedules.findFirst({
    where: and(
      eq(weeklySchedules.studentId, student.id),
      eq(weeklySchedules.weekStart, weekStart)
    ),
    with: {
      entries: {
        with: {
          subject: {
            with: { options: true },
          },
        },
      },
    },
  });

  if (!schedule) {
    // Create the schedule
    const [newSchedule] = await db
      .insert(weeklySchedules)
      .values({
        id: createId(),
        studentId: student.id,
        weekStart,
      })
      .returning();

    // Create entries for all student subjects
    if (student.subjects.length > 0) {
      await db.insert(scheduleEntries).values(
        student.subjects.map((ss) => ({
          id: createId(),
          scheduleId: newSchedule.id,
          subjectId: ss.subjectId,
        }))
      );
    }

    // Re-fetch the schedule with entries
    schedule = await db.query.weeklySchedules.findFirst({
      where: eq(weeklySchedules.id, newSchedule.id),
      with: {
        entries: {
          with: {
            subject: {
              with: { options: true },
            },
          },
        },
      },
    });
  }

  if (!schedule) {
    throw new Response("Failed to create schedule", { status: 500 });
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
  const narrationsData = await db.query.narrations.findMany({
    where: and(
      eq(narrations.studentId, student.id),
      gte(narrations.date, startOfDay(weekStart)),
      lte(narrations.date, endOfDay(weekEnd))
    ),
    columns: {
      id: true,
      subjectId: true,
      date: true,
    },
  });

  const narrationsBySubjectAndDay = new Map<string, Map<number, string>>();
  for (const narration of narrationsData) {
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

interface LoaderEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectIcon: string | null;
  subjectType: string;
  requiresNarration: boolean;
  completedDays: boolean[];
  selectedOptionId: string | null;
  options: { id: string; name: string }[];
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

  const duetEntries: DuetEntry[] = entries.map((entry) => ({
    entryId: entry.id,
    subjectName: entry.subjectName,
    subjectIcon: entry.subjectIcon ?? undefined,
    completedDays: entry.completedDays,
    requiresNarration: entry.requiresNarration,
    hasNarrationByDay: entry.hasNarrationByDay,
    subjectId: entry.subjectId,
    subjectType: entry.subjectType,
    options: entry.options,
    selectedOptionId: entry.selectedOptionId,
  }));

  return (
    <>
      {/* Tablet/Desktop: Duet View */}
      <TabletDuetView
        weekStart={new Date(weekStart)}
        entries={duetEntries}
        offDays={offDays}
        studentId={studentId}
      />

      {/* Mobile: Subject rows */}
      <div className="md:hidden p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-dark-gray">Weekly Schedule</h1>
        </div>

        {entries.length === 0 ? (
          <div className="text-center text-medium-gray py-12">
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
    </>
  );
}
