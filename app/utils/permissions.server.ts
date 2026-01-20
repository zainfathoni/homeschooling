import { redirect } from "react-router";
import { prisma } from "./db.server";
import { getUserId, getSelectedStudentId } from "./session.server";

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: { select: { id: true } },
      ownedStudents: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    throw redirect("/login");
  }

  return user;
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
  const entry = await prisma.scheduleEntry.findUnique({
    where: { id: entryId },
    include: {
      schedule: { select: { studentId: true } },
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
  const narration = await prisma.narration.findUnique({
    where: { id: narrationId },
    select: { studentId: true },
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

export async function getActiveStudentId(
  request: Request,
  user: AuthUser
): Promise<string | null> {
  if (isStudent(user) && user.studentProfile) {
    return user.studentProfile.id;
  }

  if (isParent(user)) {
    const savedStudentId = await getSelectedStudentId(request);
    if (
      savedStudentId &&
      user.ownedStudents.some((s) => s.id === savedStudentId)
    ) {
      return savedStudentId;
    }
    if (user.ownedStudents.length > 0) {
      return user.ownedStudents[0].id;
    }
  }

  return null;
}

export function canMarkComplete(user: AuthUser): boolean {
  return true;
}

export function canAddNarration(user: AuthUser): boolean {
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
