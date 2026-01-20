import { WeeklyGrid } from "~/components/schedule/WeeklyGrid";

export function meta() {
  return [
    { title: "Homeschool Planner" },
    { name: "description", content: "Weekly planning for homeschool families" },
  ];
}

export default function Home() {
  const today = new Date();

  return (
    <main className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Homeschool Planner</h1>
      <WeeklyGrid weekStart={today} offDays={[5, 6]} />
    </main>
  );
}
