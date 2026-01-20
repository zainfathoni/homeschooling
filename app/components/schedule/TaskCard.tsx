import { useFetcher, Link } from "react-router";

export interface TaskCardProps {
  entryId: string;
  dayIndex: number;
  subjectName: string;
  subjectIcon?: string;
  isCompleted: boolean;
  requiresNarration?: boolean;
  hasNarration?: boolean;
  subjectId?: string;
  date?: string;
  narrationId?: string;
}

export function TaskCard({
  entryId,
  dayIndex,
  subjectName,
  subjectIcon,
  isCompleted,
  requiresNarration,
  hasNarration,
  subjectId,
  date,
  narrationId,
}: TaskCardProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  const optimisticCompleted =
    fetcher.formData?.get("completed") === "true" ? true : isCompleted;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        optimisticCompleted ? "bg-gray-50" : "bg-lavender/50"
      }`}
    >
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
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSubmitting ? "opacity-50 cursor-wait" : "cursor-pointer"
          } ${
            optimisticCompleted
              ? "bg-coral border-coral text-white"
              : "border-gray-300 hover:border-coral"
          }`}
          aria-label={optimisticCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {optimisticCompleted && (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      </fetcher.Form>
      <div className="flex items-center gap-2 flex-1">
        {subjectIcon && <span className="text-lg">{subjectIcon}</span>}
        <span
          className={`font-medium ${
            optimisticCompleted ? "text-gray-400 line-through" : "text-gray-700"
          }`}
        >
          {subjectName}
        </span>
      </div>
      {requiresNarration && subjectId && date && (
        <Link
          to={
            hasNarration && narrationId
              ? `/narration/${narrationId}`
              : `/narration/new?subjectId=${subjectId}&date=${date}`
          }
          className={`text-xs px-2 py-1 rounded-full transition-colors ${
            hasNarration
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
          }`}
        >
          {hasNarration ? "View narration" : "Add narration"}
        </Link>
      )}
      {requiresNarration && (!subjectId || !date) && (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            hasNarration
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {hasNarration ? "Narrated" : "Needs narration"}
        </span>
      )}
    </div>
  );
}
