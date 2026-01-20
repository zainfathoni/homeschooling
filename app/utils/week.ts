import { startOfWeek, addWeeks, subWeeks, format } from "date-fns";

export function getCurrentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

export function getWeekStart(dateStr: string): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return getCurrentWeekStart();
  }
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function formatWeekParam(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getPreviousWeek(date: Date): Date {
  return subWeeks(date, 1);
}

export function getNextWeek(date: Date): Date {
  return addWeeks(date, 1);
}

export function isCurrentWeek(weekStart: Date): boolean {
  return weekStart.getTime() === getCurrentWeekStart().getTime();
}

export function isFutureWeek(weekStart: Date): boolean {
  return weekStart.getTime() > getCurrentWeekStart().getTime();
}
