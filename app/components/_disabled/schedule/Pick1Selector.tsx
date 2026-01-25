import { useFetcher } from "react-router";

export interface Pick1Option {
  id: string;
  name: string;
}

export interface Pick1SelectorProps {
  entryId: string;
  subjectName: string;
  subjectIcon?: string;
  options: Pick1Option[];
  selectedOptionId: string | null;
  completedDays: boolean[];
  offDays?: number[];
  todayIndex?: number;
}

export function Pick1Selector({
  entryId,
  subjectName,
  subjectIcon,
  options,
  selectedOptionId,
  completedDays,
  offDays = [5, 6],
  todayIndex,
}: Pick1SelectorProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  const optimisticSelectedId =
    fetcher.formData?.get("selectedOptionId")?.toString() ?? selectedOptionId;

  const selectedOption = options.find((opt) => opt.id === optimisticSelectedId);
  const displayName = selectedOption
    ? `${subjectName}: ${selectedOption.name}`
    : subjectName;

  const completedCount = completedDays.filter(
    (done, i) => done && !offDays.includes(i)
  ).length;
  const totalDays = 7 - offDays.length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {subjectIcon && <span className="text-xl">{subjectIcon}</span>}
          <span className="font-medium text-gray-700">{displayName}</span>
          {completedCount > 0 && (
            <span className="ml-auto text-sm text-gray-500">
              {completedCount}/{totalDays}
            </span>
          )}
        </div>

        <fetcher.Form method="post" action="/api/select-option">
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
                  disabled={isSubmitting}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    min-h-[44px] min-w-[44px]
                    ${
                      isSelected
                        ? "bg-coral text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                    ${isSubmitting ? "opacity-50 cursor-wait" : "cursor-pointer"}
                  `}
                >
                  {option.name}
                </button>
              );
            })}
          </div>
        </fetcher.Form>

        {selectedOption && (
          <div className="flex gap-1 mt-2">
            {completedDays.map((isCompleted, dayIndex) => {
              if (offDays.includes(dayIndex)) return null;
              const isToday = todayIndex === dayIndex;
              return (
                <CompletionCheckbox
                  key={dayIndex}
                  entryId={entryId}
                  dayIndex={dayIndex}
                  isCompleted={isCompleted}
                  isToday={isToday}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CompletionCheckbox({
  entryId,
  dayIndex,
  isCompleted,
  isToday,
}: {
  entryId: string;
  dayIndex: number;
  isCompleted: boolean;
  isToday: boolean;
}) {
  const fetcher = useFetcher();
  const optimisticCompleted =
    fetcher.formData?.get("completed") === "true" ||
    (fetcher.formData === undefined && isCompleted);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <fetcher.Form
      method="post"
      action="/api/toggle-completion"
      className="flex flex-col items-center gap-1"
    >
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="dayIndex" value={dayIndex} />
      <input
        type="hidden"
        name="completed"
        value={(!optimisticCompleted).toString()}
      />
      <span className="text-xs text-gray-500">{dayNames[dayIndex]}</span>
      <button
        type="submit"
        className={`
          w-11 h-11 rounded-lg border-2 flex items-center justify-center transition-colors
          ${isToday ? "ring-2 ring-coral ring-offset-1" : ""}
          ${
            optimisticCompleted
              ? "bg-coral border-coral text-white"
              : "bg-white border-gray-300 hover:border-coral"
          }
        `}
        aria-label={`Mark ${dayNames[dayIndex]} as ${optimisticCompleted ? "incomplete" : "complete"}`}
      >
        {optimisticCompleted && (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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
  );
}
