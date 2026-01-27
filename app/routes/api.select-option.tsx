import type { ActionFunctionArgs } from "react-router";
import { eq } from "drizzle-orm";
import { db } from "~/utils/db.server";
import { scheduleEntries } from "~/db/schema";
import {
  requireUser,
  requireScheduleEntryAccess,
} from "~/utils/permissions.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const entryId = formData.get("entryId") as string;
  const selectedOptionId = formData.get("selectedOptionId") as string;

  if (!entryId || !selectedOptionId) {
    return new Response("Invalid request", { status: 400 });
  }

  await requireScheduleEntryAccess(user, entryId);

  const entry = await db.query.scheduleEntries.findFirst({
    where: eq(scheduleEntries.id, entryId),
    with: {
      subject: {
        with: { options: true },
      },
    },
  });

  if (!entry) {
    return new Response("Entry not found", { status: 404 });
  }

  if (entry.subject.type !== "PICK1") {
    return new Response("Subject is not a PICK1 type", { status: 400 });
  }

  const validOption = entry.subject.options.some(
    (opt: { id: string }) => opt.id === selectedOptionId
  );
  if (!validOption) {
    return new Response("Invalid option for this subject", { status: 400 });
  }

  await db
    .update(scheduleEntries)
    .set({ selectedOptionId })
    .where(eq(scheduleEntries.id, entryId));

  return { success: true, selectedOptionId };
}
