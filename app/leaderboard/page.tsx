import { pageUser } from '@/lib/auth';
import { leaderboard } from '@/lib/leaderboard';
import { getLookups } from '@/lib/queries';
export const dynamic='force-dynamic';
export default async function Leaderboard({searchParams}:{searchParams:Promise<{tournament?:string}>}) {
 await pageUser();const {tournament}=await searchParams;const id=tournament&&/^[1-9]\d*$/.test(tournament)&&Number(tournament)<=2147483647?Number(tournament):null;
 const [{data,source},{data:lookups}]=await Promise.all([leaderboard(id),getLookups()]);
 return <><p className="eyebrow">PERFORMANCE / TOP 50</p><h1>Kill leaderboard</h1><p className="muted">Total recorded kills, highest first. Equal scores use a stable member order.</p><form className="search"><select name="tournament" aria-label="Tournament" defaultValue={id??''}><option value="">All tournaments</option>{lookups.tournaments.map((t:{value:number;label:string})=><option key={t.value} value={t.value}>{t.label}</option>)}</select><button>Filter</button></form><p className="badge">Served from {source}</p><table><thead><tr><th>Rank</th><th>Player</th><th>Kills</th></tr></thead><tbody>{data.map(r=><tr key={r.player_id}><td>{r.rank}</td><td>{r.username}</td><td>{r.kills}</td></tr>)}{!data.length&&<tr><td colSpan={3}>No statistics for this tournament.</td></tr>}</tbody></table></>;
}
