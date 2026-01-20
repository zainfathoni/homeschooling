import { useMemo } from "react";
import {
  startOfWeek,
  addDays,
  format,
  isSameDay,
} from "date-fns";

export interface WeeklyGridProps {
  weekStart: Date;
  offDays?: number[];
  children?: React.ReactNode;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyGrid({
  weekStart,
  offDays = [5, 6],
  children,
}: WeeklyGridProps) {
  const days = useMemo(() => {
    const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      return {
        date,
        dayIndex: i,
        dayName: DAY_NAMES[i],
        isOffDay: offDays.includes(i),
        dateLabel: format(date, "MMM d"),
        isToday: isSameDay(date, new Date()),
      };
    });
  }, [weekStart, offDays]);

  return (
    <div className="w-full">
      {/* Desktop: 7-column grid */}
      <div className="hidden md:grid md:grid-cols-7 gap-2">
        {days.map((day) => (
          <div
            key={day.dayIndex}
            className={`
              rounded-lg p-3 min-h-[120px] transition-colors
              ${day.isOffDay
                ? "bg-gray-200 text-gray-400"
                : "bg-white shadow-sm"
              }
              ${day.isToday && !day.isOffDay ? "ring-2 ring-coral" : ""}
            `}
          >
            <div className="text-center mb-2">
              <div className={`font-semibold ${day.isOffDay ? "text-gray-400" : "text-gray-700"}`}>
                {day.dayName}
              </div>
              <div className={`text-sm ${day.isOffDay ? "text-gray-400" : "text-gray-500"}`}>
                {day.dateLabel}
              </div>
            </div>
            {!day.isOffDay && children}
          </div>
        ))}
      </div>

      {/* Mobile: stacked layout */}
      <div className="md:hidden space-y-3">
        {days
          .filter((day) => !day.isOffDay)
          .map((day) => (
            <div
              key={day.dayIndex}
              className={`
                bg-white rounded-lg p-4 shadow-sm
                ${day.isToday ? "ring-2 ring-coral" : ""}
              `}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-gray-700">{day.dayName}</span>
                <span className="text-sm text-gray-500">{day.dateLabel}</span>
                {day.isToday && (
                  <span className="ml-auto text-xs bg-coral text-white px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </div>
              {children}
            </div>
          ))}
      </div>
    </div>
  );
}
