import { redirect } from "react-router";

export function meta() {
  return [
    { title: "Homeschool Planner" },
    { name: "description", content: "Weekly planning for homeschool families" },
  ];
}

export function loader() {
  return redirect("/week");
}

export default function Home() {
  return null;
}
