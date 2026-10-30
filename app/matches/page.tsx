import EntityForm from "@/components/EntityForm";
import { listMatches, getLookups } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const [{ data: matches, source }, { data: lookups }] = await Promise.all([listMatches(), getLookups()]);

  return (
    <>
      <h1>Matches</h1>
      <p className="badge">Served from {source}</p>

      <table>
        <thead>
          <tr><th>#</th><th>Tournament</th><th>Round</th><th>Date</th><th>Winner</th><th>Loser</th><th>Score</th></tr>
        </thead>
        <tbody>
          {matches.map((m: any) => (
            <tr key={m.match_id}>
              <td>{m.match_id}</td>
              <td>{m.tournament}</td>
              <td>{m.round}</td>
              <td>{m.match_date}</td>
              <td>{m.winner ?? <span className="muted">pending</span>}</td>
              <td>{m.loser ?? "-"}</td>
              <td>{m.score ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid-2 section">
        <EntityForm
          title="Schedule a match"
          endpoint="/api/matches"
          fields={[
            { name: "tournament_id", label: "Tournament", type: "select", numeric: true, options: lookups.tournaments },
            { name: "match_date", label: "Match date", type: "date" },
            { name: "round", label: "Round (e.g. Quarterfinal)" },
          ]}
        />
        <EntityForm
          title="Record match result"
          endpoint="/api/results"
          fields={[
            { name: "match_id", label: "Match", type: "select", numeric: true, options: lookups.matches },
            { name: "winning_team_id", label: "Winner", type: "select", numeric: true, options: lookups.teams },
            { name: "losing_team_id", label: "Loser", type: "select", numeric: true, options: lookups.teams },
            { name: "score", label: "Score (e.g. 13-7)" },
          ]}
        />
      </div>
    </>
  );
}
