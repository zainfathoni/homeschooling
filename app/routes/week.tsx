import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { formatWeekParam, getCurrentWeekStart } from "~/utils/week";
import { requireUser } from "~/utils/permissions.server";
import { getStudentIdFromRequest, buildStudentUrl } from "~/utils/student-url";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const currentWeek = getCurrentWeekStart();
  const studentId = getStudentIdFromRequest(request);
  const basePath = `/week/${formatWeekParam(currentWeek)}`;
  return redirect(buildStudentUrl(basePath, studentId));
}
