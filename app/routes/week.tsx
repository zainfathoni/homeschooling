import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { formatWeekParam, getCurrentWeekStart } from "~/utils/week";
import {
  requireUser,
  getDefaultStudentId,
} from "~/utils/permissions.server";
import { getStudentIdFromRequest } from "~/utils/student-url";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const currentWeek = getCurrentWeekStart();

  const studentId =
    getStudentIdFromRequest(request) ?? getDefaultStudentId(user);

  if (!studentId) {
    throw new Response("No student available", { status: 400 });
  }

  return redirect(
    `/students/${studentId}/week/${formatWeekParam(currentWeek)}`
  );
}
