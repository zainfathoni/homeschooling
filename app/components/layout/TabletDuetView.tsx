import { useState } from "react";
import { DailyFocus, type DailyTask } from "~/components/schedule/DailyFocus";
import { addDays, startOfWeek, isSameDay } from "date-fns";

export interface DuetEntry {
  entryId: string;
  subjectName: string;
  subjectIcon?: string;
  completedDays: boolean[];
  requiresNarration?: boolean;
  hasNarrationByDay?: Record<number, { hasNarration: boolean; narrationId?: string }>;
  subjectId?: string;
}

export interface TabletDuetViewProps {
  weekStart: Date;
  entries: DuetEntry[];
  offDays?: number[];
}

export function TabletDuetView({
  weekStart,
  entries,
  offDays = [5, 6],
}: TabletDuetViewProps) {
  const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
  const today = new Date();

  const initialDayIndex = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
    .findIndex((date) => isSameDay(date, today));
  
  const defaultIndex = initialDayIndex >= 0 && !offDays.includes(initialDayIndex)
    ? initialDayIndex
    : [0, 1, 2, 3, 4, 5, 6].find((i) => !offDays.includes(i)) ?? 0;

  const [selectedDayIndex, setSelectedDayIndex] = useState(defaultIndex);

  const selectedDate = addDays(monday, selectedDayIndex);

  const dailyTasks: DailyTask[] = entries.map((entry) => {
    const narrationData = entry.hasNarrationByDay?.[selectedDayIndex];
    return {
      entryId: entry.entryId,
      subjectName: entry.subjectName,
      subjectIcon: entry.subjectIcon,
      isCompleted: entry.completedDays[selectedDayIndex] ?? false,
      requiresNarration: entry.requiresNarration,
      hasNarration: narrationData?.hasNarration ?? false,
      subjectId: entry.subjectId,
      narrationId: narrationData?.narrationId,
    };
  });

  return (
    <div className="hidden md:grid md:grid-cols-2 gap-6 p-6 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-4 overflow-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Weekly Overview</h2>
        <WeeklyGridSelectable
          weekStart={weekStart}
          offDays={offDays}
          selectedDayIndex={selectedDayIndex}
          onDaySelect={setSelectedDayIndex}
        />
      </div>

      <div className="overflow-auto">
        <DailyFocus
          date={selectedDate}
          dayIndex={selectedDayIndex}
          tasks={dailyTasks}
        />
      </div>
    </div>
  );
}

interface WeeklyGridSelectableProps {
  weekStart: Date;
  offDays: number[];
  selectedDayIndex: number;
  onDaySelect: (dayIndex: number) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function WeeklyGridSelectable({
  weekStart,
  offDays,
  selectedDayIndex,
  onDaySelect,
}: WeeklyGridSelectableProps) {
  const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return {
      dayIndex: i,
      dayName: DAY_NAMES[i],
      date,
      isOffDay: offDays.includes(i),
      isToday: isSameDay(date, today),
      isSelected: i === selectedDayIndex,
    };
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => (
        <button
          key={day.dayIndex}
          type="button"
          disabled={day.isOffDay}
          onClick={() => !day.isOffDay && onDaySelect(day.dayIndex)}
          className={`
            rounded-lg p-3 min-h-[80px] transition-colors text-center
            ${day.isOffDay
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-lavender hover:bg-lavender/80 cursor-pointer"
            }
            ${day.isSelected && !day.isOffDay ? "ring-2 ring-coral bg-coral/10" : ""}
            ${day.isToday && !day.isOffDay && !day.isSelected ? "ring-2 ring-coral/50" : ""}
          `}
        >
          <div className={`font-semibold ${day.isOffDay ? "text-gray-400" : "text-gray-700"}`}>
            {day.dayName}
          </div>
          {day.isToday && !day.isOffDay && (
            <span className="inline-block mt-1 text-xs bg-coral text-white px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
