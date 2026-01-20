import type { ActionFunctionArgs } from "react-router";
import { prisma } from "~/utils/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const entryId = formData.get("entryId") as string;
  const selectedOptionId = formData.get("selectedOptionId") as string;

  if (!entryId || !selectedOptionId) {
    return new Response("Invalid request", { status: 400 });
  }

  const entry = await prisma.scheduleEntry.findUnique({
    where: { id: entryId },
    include: {
      subject: {
        include: { options: true },
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

  await prisma.scheduleEntry.update({
    where: { id: entryId },
    data: { selectedOptionId },
  });

  return { success: true, selectedOptionId };
}
