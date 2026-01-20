import { redirect } from "react-router";
import { formatWeekParam, getCurrentWeekStart } from "~/utils/week";

export function loader() {
  const currentWeek = getCurrentWeekStart();
  return redirect(`/week/${formatWeekParam(currentWeek)}`);
}
