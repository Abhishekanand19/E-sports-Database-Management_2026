import RecordActions from "@/components/RecordActions";
import EntityForm from "@/components/EntityForm";
import { listTeams, getLookups, listRoster } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const [{ data: teams, source }, { data: lookups },roster] = await Promise.all([listTeams(), getLookups(),listRoster()]);

  return (
    <>
      <h1>Teams</h1>
      <p className="badge">Served from {source}</p>

      <table>
        <thead>
          <tr><th>Team</th><th>Country</th><th>Founded</th><th>Active members</th><th>Roster</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {teams.map((t: any) => (
            <tr key={t.team_id}>
              <td>{t.team_name}</td>
              <td>{t.country}</td>
              <td>{t.founded_date ?? "-"}</td>
              <td>{t.active_members}</td>
              <td>{t.roster || <span className="muted">No active players</span>}</td>
              <td><RecordActions resource="teams" record={t} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="section">Roster history</h2>
      <table><thead><tr><th>Player</th><th>Team</th><th>Joined</th><th>Left</th><th>Status / release</th></tr></thead><tbody>{roster.map((r:any)=><tr key={`${r.player_id}-${r.team_id}-${r.join_date}`}><td>{r.username}</td><td>{r.team_name}</td><td>{r.join_date}</td><td>{r.leave_date??'-'}</td><td>{r.status}{r.status==='active'&&<EntityForm title="Release player" endpoint="/api/team-members" method="PATCH" fields={[{name:'player_id',label:'Player',type:'hidden',value:r.player_id},{name:'team_id',label:'Team',type:'hidden',value:r.team_id},{name:'join_date',label:'Joined',type:'hidden',value:r.join_date},{name:'status',label:'Status',type:'hidden',value:'inactive'},{name:'leave_date',label:'Leave date',type:'date'}]}/>}</td></tr>)}</tbody></table>
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
