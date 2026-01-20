import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { formatWeekParam, getCurrentWeekStart } from "~/utils/week";
import { requireUser } from "~/utils/permissions.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const currentWeek = getCurrentWeekStart();
  return redirect(`/week/${formatWeekParam(currentWeek)}`);
}
