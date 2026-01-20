import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { requireUser } from "~/utils/permissions.server";

export function meta() {
  return [
    { title: "Homeschool Planner" },
    { name: "description", content: "Weekly planning for homeschool families" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  return redirect("/week");
}

export default function Home() {
  return null;
}
