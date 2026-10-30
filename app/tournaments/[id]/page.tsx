import ActionButton from "@/components/ActionButton";
import { notFound } from "next/navigation";
import Link from "next/link";
import EntityForm from "@/components/EntityForm";
import { getTournamentDetail, getLookups } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournamentId = Number(id);
  if (!Number.isInteger(tournamentId)) notFound();

  const [{ data, source }, { data: lookups }] = await Promise.all([
    getTournamentDetail(tournamentId),
    getLookups(),
  ]);
  if (!data.tournament) notFound();
  const t = data.tournament;

  return (
    <>
      <p><Link href="/tournaments">&larr; All tournaments</Link></p>
      <h1>{t.name}</h1>
      <p className="muted">
        {t.game} | {t.start_date} to {t.end_date} | Prize pool ${Number(t.prize_pool).toLocaleString()}
      </p>
      <p className="badge">Served from {source}</p>

      <h2>Standings</h2>
      <table>
        <thead><tr><th>Position</th><th>Team</th><th>Played</th><th>Wins</th><th>Losses</th><th>Points</th><th>Actions</th></tr></thead>
        <tbody>
          {data.teams.map((row: any) => (
            <tr key={row.team_name}>
              <td>{row.final_position ?? "Provisional"}</td>
              <td>{row.team_name}</td><td>{row.played}</td><td>{row.wins}</td><td>{row.losses}</td><td>{row.points}</td><td><ActionButton endpoint="/api/participations" payload={{tournament_id:tournamentId,team_id:row.team_id}} label="Unregister team"/></td>
            </tr>
          ))}
          {data.teams.length === 0 && <tr><td colSpan={7} className="muted">No teams registered.</td></tr>}
        </tbody>
      </table>

      <h2>Matches</h2>
      <table>
        <thead><tr><th>Date</th><th>Round</th><th>Winner</th><th>Loser</th><th>Score</th></tr></thead>
        <tbody>
          {data.matches.map((m: any) => (
            <tr key={m.match_id}>
              <td>{m.match_date}</td>
              <td>{m.round}</td>
              <td>{m.winner ?? <span className="muted">pending</span>}</td>
              <td>{m.loser ?? "-"}</td>
              <td>{m.score ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid-2 section">
        <EntityForm
          title="Register team for this tournament"
          endpoint="/api/participations"
          fields={[
            { name: "tournament_id", label: "Tournament", type: "hidden", value: tournamentId },
            { name: "team_id", label: "Team", type: "select", numeric: true, options: lookups.teams },
            { name: "final_position", label: "Final position (optional)", type: "number", required: false },
          ]}
        />
      </div>
    </>
  );
}
