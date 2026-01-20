import { useFetcher } from "react-router";

export interface DayColumnProps {
  entryId: string;
  dayIndex: number;
  isCompleted: boolean;
  isOffDay?: boolean;
  isToday?: boolean;
}

export function DayColumn({
  entryId,
  dayIndex,
  isCompleted,
  isOffDay = false,
  isToday = false,
}: DayColumnProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  const optimisticCompleted =
    fetcher.formData?.get("completed") === "true" ? true : isCompleted;

  if (isOffDay) {
    return (
      <div className="w-11 h-11 flex items-center justify-center">
        <span className="text-gray-300">—</span>
      </div>
    );
  }

  return (
    <fetcher.Form method="post" action="/api/toggle-completion">
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="dayIndex" value={dayIndex} />
      <input
        type="hidden"
        name="completed"
        value={(!optimisticCompleted).toString()}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-11 h-11 rounded-lg border-2 flex items-center justify-center
          transition-all duration-150 ease-in-out
          ${isSubmitting ? "opacity-50 cursor-wait" : "cursor-pointer"}
          ${isToday ? "ring-2 ring-coral ring-offset-1" : ""}
          ${
            optimisticCompleted
              ? "bg-coral border-coral text-white"
              : "bg-white border-gray-300 hover:border-coral hover:bg-coral/10"
          }
        `}
        aria-label={optimisticCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {optimisticCompleted && (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>
    </fetcher.Form>
  );
}
