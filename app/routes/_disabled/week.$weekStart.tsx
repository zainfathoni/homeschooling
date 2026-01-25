import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { formatWeekParam, getWeekStart } from "~/utils/week";
import {
  requireUser,
  getDefaultStudentId,
} from "~/utils/permissions.server";
import { getStudentIdFromRequest } from "~/utils/student-url";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const weekStart = getWeekStart(params.weekStart ?? "");

  const studentId =
    getStudentIdFromRequest(request) ?? getDefaultStudentId(user);

  if (!studentId) {
    throw new Response("No student available", { status: 400 });
  }

  return redirect(
    `/students/${studentId}/week/${formatWeekParam(weekStart)}`
  );
}
