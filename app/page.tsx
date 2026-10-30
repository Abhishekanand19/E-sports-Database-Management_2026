import { getDashboardCounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data: counts, source } = await getDashboardCounts();
  const cards = [
    { label: "Players", value: counts.players },
    { label: "Teams", value: counts.teams },
    { label: "Tournaments", value: counts.tournaments },
    { label: "Matches", value: counts.matches },
  ];

  return (
    <>
      <h1>Esports Tournament & Player Management</h1>
      <p className="muted">Manage players, teams, tournaments, matches and performance stats.</p>
      <div className="grid-cards">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className="muted">{c.label}</div>
            <div className="stat-number">{c.value}</div>
          </div>
        ))}
      </div>
      <p className="badge">Counts served from {source}</p>
    </>
  );
}
