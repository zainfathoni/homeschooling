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
