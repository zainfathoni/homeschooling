import { DayColumn } from "./DayColumn";

export interface SubjectRowProps {
  entryId: string;
  subjectName: string;
  subjectIcon?: string;
  completedDays: boolean[];
  offDays?: number[];
  todayIndex?: number;
}

export function SubjectRow({
  entryId,
  subjectName,
  subjectIcon,
  completedDays,
  offDays = [5, 6],
  todayIndex,
}: SubjectRowProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3">
      {/* Desktop: horizontal row with 7 day columns */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-2 min-w-[160px]">
          {subjectIcon && <span className="text-xl">{subjectIcon}</span>}
          <span className="font-medium text-dark-gray truncate">
            {subjectName}
          </span>
        </div>
        <div className="flex gap-1 flex-1 justify-end">
          {completedDays.map((isCompleted, dayIndex) => (
            <DayColumn
              key={dayIndex}
              entryId={entryId}
              dayIndex={dayIndex}
              isCompleted={isCompleted}
              isOffDay={offDays.includes(dayIndex)}
              isToday={todayIndex === dayIndex}
            />
          ))}
        </div>
      </div>

      {/* Mobile: subject header with only school day checkboxes */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 mb-3">
          {subjectIcon && <span className="text-xl">{subjectIcon}</span>}
          <span className="font-medium text-dark-gray">{subjectName}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {completedDays.map((isCompleted, dayIndex) => {
            if (offDays.includes(dayIndex)) return null;
            return (
              <div key={dayIndex} className="flex flex-col items-center gap-1">
                <span className="text-xs text-medium-gray">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dayIndex]}
                </span>
                <DayColumn
                  entryId={entryId}
                  dayIndex={dayIndex}
                  isCompleted={isCompleted}
                  isToday={todayIndex === dayIndex}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
