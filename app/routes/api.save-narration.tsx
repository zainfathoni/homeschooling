import type { ActionFunctionArgs } from "react-router";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { db } from "~/utils/db.server";
import { subjects, narrations } from "~/db/schema";
import {
  requireUser,
  getActiveStudentId,
  requireStudentAccess,
} from "~/utils/permissions.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();

  const subjectId = formData.get("subjectId") as string;
  const dateStr = formData.get("date") as string;
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const studentIdParam = formData.get("studentId") as string | null;

  if (!subjectId || !dateStr || !type || !content?.trim()) {
    return new Response("Missing required fields", { status: 400 });
  }

  if (!["TEXT", "VOICE", "PHOTO"].includes(type)) {
    return new Response("Invalid narration type", { status: 400 });
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return new Response("Invalid date", { status: 400 });
  }

  const studentId = studentIdParam ?? (await getActiveStudentId(request, user));
  if (!studentId) {
    return new Response("No student selected", { status: 400 });
  }

  await requireStudentAccess(user, studentId);

  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.id, subjectId),
  });

  if (!subject) {
    return new Response("Subject not found", { status: 404 });
  }

  const [narration] = await db
    .insert(narrations)
    .values({
      id: createId(),
      studentId,
      subjectId,
      date,
      type: type as "TEXT" | "VOICE" | "PHOTO",
      content: content.trim(),
    })
    .returning();

  return { success: true, narrationId: narration.id };
}
