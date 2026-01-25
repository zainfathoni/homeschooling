import { redirect } from "react-router";
import { eq } from "drizzle-orm";
import { db } from "./db.server";
import { users, scheduleEntries, narrations } from "../db/schema";
import { getUserId, getSelectedStudentId } from "./session.server";
import { getStudentIdFromRequest } from "./student-url";

type Role = "PARENT" | "STUDENT";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  studentProfile: { id: string } | null;
  ownedStudents: { id: string; name: string }[];
};

export async function requireUser(request: Request): Promise<AuthUser> {
  const userId = await getUserId(request);
  if (!userId) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams([["redirectTo", url.pathname]]);
    throw redirect(`/login?${searchParams}`);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      studentProfile: { columns: { id: true } },
      ownedStudents: { columns: { id: true, name: true } },
    },
  });

  if (!user) {
    throw redirect("/login");
  }

  return user as AuthUser;
}

export function isParent(user: AuthUser): boolean {
  return user.role === "PARENT";
}

export function isStudent(user: AuthUser): boolean {
  return user.role === "STUDENT";
}

export function getAccessibleStudentIds(user: AuthUser): string[] {
  if (isParent(user)) {
    return user.ownedStudents.map((s) => s.id);
  }
  if (user.studentProfile) {
    return [user.studentProfile.id];
  }
  return [];
}

export async function requireStudentAccess(
  user: AuthUser,
  studentId: string
): Promise<void> {
  const accessibleIds = getAccessibleStudentIds(user);
  if (!accessibleIds.includes(studentId)) {
    throw new Response("Forbidden: You cannot access this student's data", {
      status: 403,
    });
  }
}

export async function requireScheduleEntryAccess(
  user: AuthUser,
  entryId: string
): Promise<void> {
  const entry = await db.query.scheduleEntries.findFirst({
    where: eq(scheduleEntries.id, entryId),
    with: {
      schedule: { columns: { studentId: true } },
    },
  });

  if (!entry) {
    throw new Response("Entry not found", { status: 404 });
  }

  await requireStudentAccess(user, entry.schedule.studentId);
}

export async function requireNarrationAccess(
  user: AuthUser,
  narrationId: string
): Promise<void> {
  const narration = await db.query.narrations.findFirst({
    where: eq(narrations.id, narrationId),
    columns: { studentId: true },
  });

  if (!narration) {
    throw new Response("Narration not found", { status: 404 });
  }

  await requireStudentAccess(user, narration.studentId);
}

export function getDefaultStudentId(user: AuthUser): string | null {
  if (isStudent(user) && user.studentProfile) {
    return user.studentProfile.id;
  }
  if (isParent(user) && user.ownedStudents.length > 0) {
    return user.ownedStudents[0].id;
  }
  return null;
}

/**
 * Get the active student ID for the current request.
 *
 * Priority order:
 * 1. URL query parameter `?student=:studentId` (primary)
 * 2. Cookie-based selection (deprecated, for backwards compatibility)
 * 3. First owned student (fallback)
 */
export async function getActiveStudentId(
  request: Request,
  user: AuthUser
): Promise<string | null> {
  // Students always view their own data
  if (isStudent(user) && user.studentProfile) {
    return user.studentProfile.id;
  }

  if (isParent(user)) {
    // 1. Check URL query parameter (primary method)
    const urlStudentId = getStudentIdFromRequest(request);
    if (
      urlStudentId &&
      user.ownedStudents.some((s) => s.id === urlStudentId)
    ) {
      return urlStudentId;
    }

    // 2. Fall back to cookie (deprecated)
    const savedStudentId = await getSelectedStudentId(request);
    if (
      savedStudentId &&
      user.ownedStudents.some((s) => s.id === savedStudentId)
    ) {
      return savedStudentId;
    }

    // 3. Default to first student
    if (user.ownedStudents.length > 0) {
      return user.ownedStudents[0].id;
    }
  }

  return null;
}

export function canMarkComplete(_user: AuthUser): boolean {
  return true;
}

export function canAddNarration(_user: AuthUser): boolean {
  return true;
}

export function canViewAllStudents(user: AuthUser): boolean {
  return isParent(user);
}

export function canManageSubjects(user: AuthUser): boolean {
  return isParent(user);
}

export function canManageSchedule(user: AuthUser): boolean {
  return isParent(user);
}
