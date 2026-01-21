import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { formatWeekParam, getCurrentWeekStart } from "~/utils/week";

export async function loader({ params }: LoaderFunctionArgs) {
  const { studentId } = params;

  if (!studentId) {
    throw new Response("Student ID required", { status: 400 });
  }

  const currentWeek = getCurrentWeekStart();
  return redirect(`/students/${studentId}/week/${formatWeekParam(currentWeek)}`);
}
