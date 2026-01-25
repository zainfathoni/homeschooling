import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { formatWeekParam, getCurrentWeekStart } from "~/utils/week";
import {
  requireUser,
  getDefaultStudentId,
} from "~/utils/permissions.server";

export function meta() {
  return [
    { title: "Homeschool Planner" },
    { name: "description", content: "Weekly planning for homeschool families" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const currentWeek = getCurrentWeekStart();

  const studentId = getDefaultStudentId(user);

  if (!studentId) {
    throw new Response("No student available", { status: 400 });
  }

  return redirect(
    `/students/${studentId}/week/${formatWeekParam(currentWeek)}`
  );
}

export default function Home() {
  return null;
}
