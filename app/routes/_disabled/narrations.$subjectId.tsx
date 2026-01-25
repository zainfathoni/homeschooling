import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import {
  requireUser,
  getDefaultStudentId,
} from "~/utils/permissions.server";
import { getStudentIdFromRequest } from "~/utils/student-url";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { subjectId } = params;

  if (!subjectId) {
    throw new Response("Subject ID required", { status: 400 });
  }

  const studentId =
    getStudentIdFromRequest(request) ?? getDefaultStudentId(user);

  if (!studentId) {
    throw new Response("No student available", { status: 400 });
  }

  return redirect(`/students/${studentId}/narrations/${subjectId}`);
}
