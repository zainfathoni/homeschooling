import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Link, useFetcher } from "react-router";
import { prisma } from "~/utils/db.server";
import { getWeekStart, formatWeekParam } from "~/utils/week";
import { format } from "date-fns";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function meta() {
  return [
    { title: "Week Settings | Homeschool Planner" },
    { name: "description", content: "Configure school days for this week" },
  ];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const weekStart = getWeekStart(params.weekStart ?? "");

  const student = await prisma.student.findFirst();

  if (!student) {
    return {
      weekStart: weekStart.toISOString(),
      schoolDays: [0, 1, 2, 3, 4],
      scheduleId: null,
    };
  }

  let schedule = await prisma.weeklySchedule.findUnique({
    where: {
      studentId_weekStart: {
        studentId: student.id,
        weekStart,
      },
    },
  });

  if (!schedule) {
    schedule = await prisma.weeklySchedule.create({
      data: {
        studentId: student.id,
        weekStart,
        schoolDays: JSON.stringify([0, 1, 2, 3, 4]),
      },
    });
  }

  const schoolDays = JSON.parse(schedule.schoolDays) as number[];

  return {
    weekStart: weekStart.toISOString(),
    schoolDays,
    scheduleId: schedule.id,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const scheduleId = formData.get("scheduleId") as string;
  const schoolDaysJson = formData.get("schoolDays") as string;

  if (!scheduleId || !schoolDaysJson) {
    return new Response("Invalid request", { status: 400 });
  }

  const schoolDays = JSON.parse(schoolDaysJson) as number[];

  if (
    !Array.isArray(schoolDays) ||
    schoolDays.some((d) => typeof d !== "number" || d < 0 || d > 6)
  ) {
    return new Response("Invalid school days", { status: 400 });
  }

  await prisma.weeklySchedule.update({
    where: { id: scheduleId },
    data: { schoolDays: JSON.stringify(schoolDays) },
  });

  return { success: true, schoolDays };
}

interface LoaderData {
  weekStart: string;
  schoolDays: number[];
  scheduleId: string | null;
}

export default function WeekSettings() {
  const { weekStart, schoolDays, scheduleId } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();

  const weekStartDate = new Date(weekStart);
  const weekDisplay = format(weekStartDate, "MMM d, yyyy");

  const optimisticSchoolDays =
    fetcher.formData?.get("schoolDays")
      ? (JSON.parse(fetcher.formData.get("schoolDays") as string) as number[])
      : schoolDays;

  function toggleDay(dayIndex: number) {
    if (!scheduleId) return;

    const newSchoolDays = optimisticSchoolDays.includes(dayIndex)
      ? optimisticSchoolDays.filter((d) => d !== dayIndex)
      : [...optimisticSchoolDays, dayIndex].sort((a, b) => a - b);

    fetcher.submit(
      {
        scheduleId,
        schoolDays: JSON.stringify(newSchoolDays),
      },
      { method: "post" }
    );
  }

  return (
    <main className="p-4 md:p-6 max-w-2xl mx-auto bg-lavender min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to={`/week/${formatWeekParam(weekStartDate)}`}
          className="flex items-center justify-center w-11 h-11 rounded-lg bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
          aria-label="Back to week view"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Week Settings</h1>
          <p className="text-sm text-gray-600">Week of {weekDisplay}</p>
        </div>
      </div>

      <section className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          School Days
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Toggle which days are school days this week. Off days will be grayed
          out in the schedule.
        </p>

        {!scheduleId ? (
          <p className="text-gray-500 text-sm">
            No schedule found. Add a student first.
          </p>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {DAY_NAMES.map((dayName, index) => {
              const isSchoolDay = optimisticSchoolDays.includes(index);
              const isSubmitting = fetcher.state !== "idle";

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDay(index)}
                  disabled={isSubmitting}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-lg border-2
                    transition-all duration-150 min-h-[72px]
                    ${isSubmitting ? "opacity-50 cursor-wait" : "cursor-pointer"}
                    ${
                      isSchoolDay
                        ? "bg-coral border-coral text-white"
                        : "bg-gray-100 border-gray-200 text-gray-500 hover:border-coral/50"
                    }
                  `}
                  aria-label={`${dayName}: ${isSchoolDay ? "School day" : "Off day"}. Click to toggle.`}
                  aria-pressed={isSchoolDay}
                >
                  <span className="text-sm font-medium">{dayName}</span>
                  <span className="text-xs mt-1">
                    {isSchoolDay ? "School" : "Off"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {optimisticSchoolDays.length} school day
            {optimisticSchoolDays.length !== 1 ? "s" : ""} configured
          </p>
        </div>
      </section>
    </main>
  );
}
