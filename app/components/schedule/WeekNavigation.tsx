import { Link } from "react-router";
import { format } from "date-fns";
import {
  formatWeekParam,
  getPreviousWeek,
  getNextWeek,
  isCurrentWeek,
  isFutureWeek,
} from "~/utils/week";

interface WeekNavigationProps {
  weekStart: Date;
}

export function WeekNavigation({ weekStart }: WeekNavigationProps) {
  const prevWeek = getPreviousWeek(weekStart);
  const nextWeek = getNextWeek(weekStart);
  const showCurrentWeek = !isCurrentWeek(weekStart);
  const canGoNext = !isFutureWeek(nextWeek);

  const weekDisplay = format(weekStart, "MMM d, yyyy");

  return (
    <nav className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm mb-4">
      <Link
        to={`/week/${formatWeekParam(prevWeek)}`}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-lavender rounded-md transition-colors min-w-[44px] min-h-[44px] justify-center"
        aria-label="Previous week"
      >
        <span aria-hidden="true">←</span>
        <span className="hidden sm:inline">Prev</span>
      </Link>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-800">
          Week of {weekDisplay}
        </span>
        {showCurrentWeek && (
          <Link
            to="/week"
            className="text-xs px-2 py-1 text-coral hover:text-coral/80 underline"
          >
            Today
          </Link>
        )}
        <Link
          to={`/week/${formatWeekParam(weekStart)}/settings`}
          className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Week settings"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Link>
      </div>

      {canGoNext ? (
        <Link
          to={`/week/${formatWeekParam(nextWeek)}`}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-lavender rounded-md transition-colors min-w-[44px] min-h-[44px] justify-center"
          aria-label="Next week"
        >
          <span className="hidden sm:inline">Next</span>
          <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <div className="min-w-[44px] min-h-[44px]" aria-hidden="true" />
      )}
    </nav>
  );
}
