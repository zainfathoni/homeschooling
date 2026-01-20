import type { ActionFunctionArgs } from "react-router";
import { prisma } from "~/utils/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const entryId = formData.get("entryId") as string;
  const dayIndex = parseInt(formData.get("dayIndex") as string, 10);
  const completed = formData.get("completed") === "true";

  if (!entryId || isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
    return new Response("Invalid request", { status: 400 });
  }

  const entry = await prisma.scheduleEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    return new Response("Entry not found", { status: 404 });
  }

  const completedDays: boolean[] = JSON.parse(entry.completedDays);
  completedDays[dayIndex] = completed;

  await prisma.scheduleEntry.update({
    where: { id: entryId },
    data: { completedDays: JSON.stringify(completedDays) },
  });

  return { success: true, completedDays };
}
