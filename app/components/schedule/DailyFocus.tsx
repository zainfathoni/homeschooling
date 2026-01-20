import { format } from "date-fns";
import { ProgressRing } from "./ProgressRing";

export interface DailyTask {
  id: string;
  subjectName: string;
  subjectIcon?: string;
  isCompleted: boolean;
  requiresNarration?: boolean;
  hasNarration?: boolean;
}

export interface DailyFocusProps {
  date: Date;
  tasks: DailyTask[];
  onToggleComplete?: (taskId: string, completed: boolean) => void;
}

export function DailyFocus({ date, tasks, onToggleComplete }: DailyFocusProps) {
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
          <div
            key={task.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              task.isCompleted ? "bg-gray-50" : "bg-lavender/50"
            }`}
          >
            <button
              onClick={() => onToggleComplete?.(task.id, !task.isCompleted)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.isCompleted
                  ? "bg-coral border-coral text-white"
                  : "border-gray-300 hover:border-coral"
              }`}
              aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
            >
              {task.isCompleted && (
                <svg
                  className="w-4 h-4"
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
            <div className="flex items-center gap-2 flex-1">
              {task.subjectIcon && (
                <span className="text-lg">{task.subjectIcon}</span>
              )}
              <span
                className={`font-medium ${
                  task.isCompleted ? "text-gray-400 line-through" : "text-gray-700"
                }`}
              >
                {task.subjectName}
              </span>
            </div>
            {task.requiresNarration && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  task.hasNarration
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {task.hasNarration ? "Narrated" : "Needs narration"}
              </span>
            )}
          </div>
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
