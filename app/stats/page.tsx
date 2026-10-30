import EntityForm from "@/components/EntityForm";
import { getPlayerStats, getLookups } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ tournament?: string }>;
}) {
  const { tournament } = await searchParams;
  const tournamentId =
    tournament &&
    /^[1-9]\d*$/.test(tournament) &&
    Number(tournament) <= 2147483647
      ? Number(tournament)
      : null;
  const [{ data: stats, source }, { data: lookups }] = await Promise.all([
    getPlayerStats(tournamentId),
    getLookups(),
  ]);

  return (
    <>
      <h1>Player performance</h1>
      <p className="muted">
        Aggregated across recorded matches, best average rating first. Filter by
        tournament below.
      </p>
      <form className="search">
        <select
          name="tournament"
          aria-label="Tournament"
          defaultValue={tournamentId ?? ""}
        >
          <option value="">All tournaments</option>
          {lookups.tournaments.map((t: any) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button>Filter</button>
      </form>
      <p className="badge">Served from {source}</p>

      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Matches</th>
            <th>Kills</th>
            <th>Deaths</th>
            <th>Assists</th>
            <th>K/D</th>
            <th>Avg rating</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s: any) => (
            <tr key={s.username}>
              <td>{s.username}</td>
              <td>{s.matches}</td>
              <td>{s.kills}</td>
              <td>{s.deaths}</td>
              <td>{s.assists}</td>
              <td>{s.kd}</td>
              <td>{s.avg_rating ?? "-"}</td>
            </tr>
          ))}
          {stats.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                No stats recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="grid-2 section">
        <EntityForm
          title="Record player stats for a match"
          endpoint="/api/stats"
          fields={[
            {
              name: "match_id",
              label: "Match",
              type: "select",
              numeric: true,
              options: lookups.matches,
            },
            {
              name: "team_id",
              label: "Team",
              type: "select",
              numeric: true,
              options: lookups.teams,
            },
            {
              name: "player_id",
              label: "Player",
              type: "select",
              numeric: true,
              options: lookups.players,
            },
            { name: "kills", label: "Kills", type: "number" },
            { name: "deaths", label: "Deaths", type: "number" },
            { name: "assists", label: "Assists", type: "number" },
            { name: "damage", label: "Damage", type: "number" },
            {
              name: "rating",
              label: "Rating (e.g. 1.10)",
              type: "number",
              step: "0.01",
              required: false,
            },
          ]}
        />
      </div>
    </>
  );
}
