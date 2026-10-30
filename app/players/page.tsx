import RecordActions from "@/components/RecordActions";
import EntityForm from "@/components/EntityForm";
import { listPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ROLES = ["Carry", "Support", "IGL", "Flex"];

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { data: players, source } = await listPlayers(q);

  return (
    <div className="grid-2">
      <section>
        <h1>Players</h1>
        <form className="search">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by username, country or role"
          />
          <button type="submit">Search</button>
        </form>
        <p className="badge">Served from {source}</p>

        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Country</th>
              <th>Role</th>
              <th>Date of birth</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p: any) => (
              <tr key={p.player_id}>
                <td>{p.username}</td>
                <td>{p.country}</td>
                <td>{p.role}</td>
                <td>{p.date_of_birth}</td>
                <td>
                  <RecordActions resource="players" record={p} />
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No players found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <EntityForm
        title="Add player"
        endpoint="/api/players"
        fields={[
          { name: "username", label: "Username" },
          { name: "country", label: "Country" },
          {
            name: "role",
            label: "Role",
            type: "select",
            options: ROLES.map((r) => ({ value: r, label: r })),
          },
          { name: "date_of_birth", label: "Date of birth", type: "date" },
        ]}
      />
    </div>
  );
}
