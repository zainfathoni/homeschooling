export function meta() {
  return [
    { title: "Homeschool Planner" },
    { name: "description", content: "Weekly planning for homeschool families" },
  ];
}

export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Homeschool Planner</h1>
      <p>Weekly planning for homeschool families.</p>
    </main>
  );
}
