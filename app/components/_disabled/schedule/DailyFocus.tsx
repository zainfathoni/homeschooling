import { format, formatISO } from "date-fns";
import { ProgressRing } from "./ProgressRing";
import { TaskCard } from "./TaskCard";

export interface DailyTask {
  entryId: string;
  subjectName: string;
  subjectIcon?: string;
  isCompleted: boolean;
  requiresNarration?: boolean;
  hasNarration?: boolean;
  subjectId?: string;
  narrationId?: string;
}

export interface DailyFocusProps {
  date: Date;
  dayIndex: number;
  tasks: DailyTask[];
  studentId?: string;
}

export function DailyFocus({ date, dayIndex, tasks, studentId }: DailyFocusProps) {
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const dayName = format(date, "EEEE");
  const dateString = format(date, "MMMM d, yyyy");

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col items-center text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">{dayName}</h2>
        <p className="text-sm text-gray-500">{dateString}</p>
        <div className="mt-4">
          <ProgressRing percentage={percentage} />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {completedCount} of {totalCount} tasks complete
        </p>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.entryId}
            entryId={task.entryId}
            dayIndex={dayIndex}
            subjectName={task.subjectName}
            subjectIcon={task.subjectIcon}
            isCompleted={task.isCompleted}
            requiresNarration={task.requiresNarration}
            hasNarration={task.hasNarration}
            subjectId={task.subjectId}
            date={formatISO(date, { representation: "date" })}
            narrationId={task.narrationId}
            studentId={studentId}
          />
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No tasks for this day</p>
        </div>
      )}
    </div>
  );
}
