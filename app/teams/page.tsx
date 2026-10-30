import EntityForm from "@/components/EntityForm";
import { listTeams, getLookups } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const [{ data: teams, source }, { data: lookups }] = await Promise.all([listTeams(), getLookups()]);

  return (
    <>
      <h1>Teams</h1>
      <p className="badge">Served from {source}</p>

      <table>
        <thead>
          <tr><th>Team</th><th>Country</th><th>Founded</th><th>Active members</th><th>Roster</th></tr>
        </thead>
        <tbody>
          {teams.map((t: any) => (
            <tr key={t.team_id}>
              <td>{t.team_name}</td>
              <td>{t.country}</td>
              <td>{t.founded_date ?? "-"}</td>
              <td>{t.active_members}</td>
              <td>{t.roster || <span className="muted">No active players</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid-2 section">
        <EntityForm
          title="Add team"
          endpoint="/api/teams"
          fields={[
            { name: "team_name", label: "Team name" },
            { name: "country", label: "Country" },
            { name: "founded_date", label: "Founded date", type: "date", required: false },
          ]}
        />
        <EntityForm
          title="Add player to team"
          endpoint="/api/team-members"
          fields={[
            { name: "team_id", label: "Team", type: "select", numeric: true, options: lookups.teams },
            { name: "player_id", label: "Player", type: "select", numeric: true, options: lookups.players },
            { name: "join_date", label: "Join date", type: "date" },
            { name: "status", label: "Status", type: "select", options: [
              { value: "active", label: "active" }, { value: "inactive", label: "inactive" },
            ] },
          ]}
        />
      </div>
    </>
  );
}
