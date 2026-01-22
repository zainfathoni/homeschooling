import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { formatWeekParam, getCurrentWeekStart } from "~/utils/week";

/**
 * Redirect /students/:studentId/settings to /students/:studentId/week/:weekStart/settings
 * This allows the settings link in the navigation to work without week context.
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { studentId } = params;

  if (!studentId) {
    throw new Response("Student ID required", { status: 400 });
  }

  const currentWeek = getCurrentWeekStart();
  return redirect(
    `/students/${studentId}/week/${formatWeekParam(currentWeek)}/settings`
  );
}
