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
