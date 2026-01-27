import { useFetcher, Link } from "react-router";
import { buildStudentUrl } from "~/utils/student-url";

export interface Pick1Option {
  id: string;
  name: string;
}

export interface Pick1TaskCardProps {
  entryId: string;
  dayIndex: number;
  subjectName: string;
  subjectIcon?: string;
  isCompleted: boolean;
  options: Pick1Option[];
  selectedOptionId: string | null;
  requiresNarration?: boolean;
  hasNarration?: boolean;
  subjectId?: string;
  date?: string;
  narrationId?: string;
  studentId?: string;
}

export function Pick1TaskCard({
  entryId,
  dayIndex,
  subjectName,
  subjectIcon,
  isCompleted,
  options,
  selectedOptionId,
  requiresNarration,
  hasNarration,
  subjectId,
  date,
  narrationId,
  studentId,
}: Pick1TaskCardProps) {
  const optionFetcher = useFetcher();
  const completionFetcher = useFetcher();

  const isOptionSubmitting = optionFetcher.state !== "idle";
  const isCompletionSubmitting = completionFetcher.state !== "idle";

  const optimisticSelectedId =
    optionFetcher.formData?.get("selectedOptionId")?.toString() ?? selectedOptionId;

  const optimisticCompleted =
    completionFetcher.formData?.get("completed") === "true" ? true : isCompleted;

  const selectedOption = options.find((opt) => opt.id === optimisticSelectedId);
  const displayName = selectedOption
    ? `${subjectName}: ${selectedOption.name}`
    : subjectName;

  return (
    <div className="bg-lavender/30 rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2">
        {subjectIcon && <span className="text-lg">{subjectIcon}</span>}
        <span className="font-medium text-dark-gray">{displayName}</span>
      </div>

      <optionFetcher.Form method="post" action="/api/select-option">
        <input type="hidden" name="entryId" value={entryId} />
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = option.id === optimisticSelectedId;
            return (
              <button
                key={option.id}
                type="submit"
                name="selectedOptionId"
                value={option.id}
                disabled={isOptionSubmitting}
                data-testid={`pick1-option-${option.name.toLowerCase().replace(/\s+/g, "-")}`}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  min-h-[44px] min-w-[44px]
                  ${
                    isSelected
                      ? "bg-coral text-white"
                      : "bg-light-gray text-medium-gray hover:bg-lavender"
                  }
                  ${isOptionSubmitting ? "opacity-50 cursor-wait" : "cursor-pointer"}
                `}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      </optionFetcher.Form>

      {selectedOption && (
        <div className="flex items-center gap-3 pt-2 border-t border-light-gray">
          <completionFetcher.Form method="post" action="/api/toggle-completion">
            <input type="hidden" name="entryId" value={entryId} />
            <input type="hidden" name="dayIndex" value={dayIndex} />
            <input
              type="hidden"
              name="completed"
              value={(!optimisticCompleted).toString()}
            />
            <button
              type="submit"
              disabled={isCompletionSubmitting}
              className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors ${
                isCompletionSubmitting ? "opacity-50 cursor-wait" : "cursor-pointer"
              } ${
                optimisticCompleted
                  ? "bg-coral border-coral text-white"
                  : "border-medium-gray hover:border-coral"
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
          </completionFetcher.Form>
          <span
            className={`flex-1 font-medium ${
              optimisticCompleted ? "text-medium-gray line-through" : "text-dark-gray"
            }`}
          >
            Today&apos;s task
          </span>
          {requiresNarration && subjectId && date && (
            <Link
              to={
                hasNarration && narrationId
                  ? buildStudentUrl(`/narration/${narrationId}`, studentId)
                  : buildStudentUrl(`/narration/new?subjectId=${subjectId}&date=${date}`, studentId)
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
        </div>
      )}
    </div>
  );
}
