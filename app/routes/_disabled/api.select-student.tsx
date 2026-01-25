/**
 * @deprecated This API endpoint is deprecated.
 *
 * Student selection has been refactored to use URL query parameters (?student=:studentId)
 * instead of cookies. This provides:
 * - Shareable links to specific student views
 * - Proper browser back/forward navigation
 * - Fixes for React Router revalidation issues (especially on WebKit/Linux)
 *
 * This endpoint remains for backwards compatibility but will be removed in a future version.
 * The StudentSwitcher component now uses client-side navigation instead of posting here.
 */
import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import {
  requireUser,
  getAccessibleStudentIds,
} from "~/utils/permissions.server";
import { setSelectedStudentId } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  const formData = await request.formData();
  const studentId = formData.get("studentId");

  if (typeof studentId !== "string") {
    return data({ error: "Invalid student ID" }, { status: 400 });
  }

  const accessibleStudentIds = getAccessibleStudentIds(user);
  if (!accessibleStudentIds.includes(studentId)) {
    return data(
      { error: "You do not have access to this student" },
      { status: 403 }
    );
  }

  const setCookie = await setSelectedStudentId(request, studentId);

  return data(
    { success: true, studentId },
    {
      headers: {
        "Set-Cookie": setCookie,
      },
    }
  );
}
