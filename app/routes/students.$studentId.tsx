import type { LoaderFunctionArgs } from "react-router";
import { Outlet, redirect, useLoaderData } from "react-router";
import { AppShell } from "~/components/layout";
import {
  requireUser,
  requireStudentAccess,
  isStudent,
  isParent,
  type AuthUser,
} from "~/utils/permissions.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { studentId } = params;

  if (!studentId) {
    throw new Response("Student ID required", { status: 400 });
  }

  // Students can only view their own data - redirect if trying to view another
  if (isStudent(user) && user.studentProfile) {
    if (studentId !== user.studentProfile.id) {
      // Preserve the rest of the path, just fix the studentId
      const url = new URL(request.url);
      const pathAfterStudent = url.pathname.replace(
        `/students/${studentId}`,
        `/students/${user.studentProfile.id}`
      );
      throw redirect(pathAfterStudent + url.search);
    }
  }

  // Parents must have access to this student
  if (isParent(user)) {
    await requireStudentAccess(user, studentId);
  }

  return {
    selectedStudentId: studentId,
    students: user.ownedStudents,
    userRole: user.role,
  };
}

interface LoaderData {
  selectedStudentId: string;
  students: AuthUser["ownedStudents"];
  userRole: AuthUser["role"];
}

export default function StudentLayout() {
  const { selectedStudentId, students, userRole } = useLoaderData<LoaderData>();

  return (
    <AppShell
      selectedStudentId={selectedStudentId}
      students={students}
      userRole={userRole}
    >
      <Outlet />
    </AppShell>
  );
}
