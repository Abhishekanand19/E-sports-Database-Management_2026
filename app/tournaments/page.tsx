import RecordActions from "@/components/RecordActions";
import Link from "next/link";
import EntityForm from "@/components/EntityForm";
import { listTournaments, getLookups } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const [{ data: tournaments, source }, { data: lookups }] = await Promise.all([
    listTournaments(),
    getLookups(),
  ]);

  return (
    <>
      <h1>Tournaments</h1>
      <p className="badge">Served from {source}</p>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Game</th>
            <th>Dates</th>
            <th>Prize pool</th>
            <th>Teams</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tournaments.map((t: any) => (
            <tr key={t.tournament_id}>
              <td>
                <Link href={`/tournaments/${t.tournament_id}`}>{t.name}</Link>
              </td>
              <td>{t.game}</td>
              <td>
                {t.start_date} to {t.end_date}
              </td>
              <td>${Number(t.prize_pool).toLocaleString()}</td>
              <td>{t.teams}</td>
              <td>
                <RecordActions resource="tournaments" record={t} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid-2 section">
        <EntityForm
          title="Create tournament"
          endpoint="/api/tournaments"
          fields={[
            { name: "name", label: "Tournament name" },
            {
              name: "game_id",
              label: "Game",
              type: "select",
              numeric: true,
              options: lookups.games,
            },
            { name: "start_date", label: "Start date", type: "date" },
            { name: "end_date", label: "End date", type: "date" },
            {
              name: "prize_pool",
              label: "Prize pool",
              type: "number",
              step: "0.01",
            },
          ]}
        />
      </div>
    </>
  );
}
