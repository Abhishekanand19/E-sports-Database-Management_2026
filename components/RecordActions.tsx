"use client";
import EntityForm, { type Field } from "./EntityForm";
import DeleteButton from "./DeleteButton";
import { useUser } from "./SessionProvider";
const configs: Record<string, { key: string; fields: Field[] }> = {
  players: {
    key: "player_id",
    fields: [
      { name: "username", label: "Username" },
      { name: "country", label: "Country" },
      { name: "role", label: "Role" },
      { name: "date_of_birth", label: "Date of birth", type: "date" },
    ],
  },
  teams: {
    key: "team_id",
    fields: [
      { name: "team_name", label: "Team name" },
      { name: "country", label: "Country" },
      {
        name: "founded_date",
        label: "Founded date",
        type: "date",
        required: false,
      },
    ],
  },
  tournaments: {
    key: "tournament_id",
    fields: [
      { name: "name", label: "Tournament name" },
      { name: "game_id", label: "Game ID", type: "number" },
      { name: "start_date", label: "Start date", type: "date" },
      { name: "end_date", label: "End date", type: "date" },
      { name: "prize_pool", label: "Prize pool", type: "number", step: "0.01" },
    ],
  },
};
export default function RecordActions({
  resource,
  record,
}: {
  resource: "players" | "teams" | "tournaments";
  record: Record<string, string | number | null>;
}) {
  const user = useUser();
  if (user?.role !== "admin") return null;
  const config = configs[resource];
  const endpoint = `/api/${resource}/${record[config.key]}`;
  return (
    <div className="actions">
      <details>
        <summary>
          Edit {record.username ?? record.team_name ?? record.name}
        </summary>
        <EntityForm
          title="Edit record"
          endpoint={endpoint}
          method="PUT"
          reset={false}
          fields={config.fields.map((f) => ({
            ...f,
            defaultValue: record[f.name] ?? "",
          }))}
        />
      </details>
      <DeleteButton url={endpoint} />
    </div>
  );
}
