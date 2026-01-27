import { useFetcher } from "react-router";
import { DayColumn } from "./DayColumn";

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
          <span className="font-medium text-dark-gray">{displayName}</span>
          {completedCount > 0 && (
            <span className="ml-auto text-sm text-medium-gray">
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
                  data-testid={`pick1-option-${option.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-colors
                    min-h-[44px] min-w-[44px]
                    ${
                      isSelected
                        ? "bg-coral text-white"
                        : "bg-light-gray text-medium-gray hover:bg-lavender"
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
          <div className="flex gap-2 flex-wrap mt-2">
            {completedDays.map((isCompleted, dayIndex) => {
              if (offDays.includes(dayIndex)) return null;
              const isToday = todayIndex === dayIndex;
              return (
                <div key={dayIndex} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-medium-gray">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dayIndex]}
                  </span>
                  <DayColumn
                    entryId={entryId}
                    dayIndex={dayIndex}
                    isCompleted={isCompleted}
                    isToday={isToday}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
