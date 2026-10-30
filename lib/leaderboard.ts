import { pool } from './db';
import { getRedis } from './redis';
import { revisionKey,type Sourced } from './cache';
export type Leader={player_id:number;username:string;kills:number;rank:number};
export async function leaderboard(tournamentId:number|null=null):Promise<Sourced<Leader[]>> {
 const key=await revisionKey(`leaderboard:${tournamentId}`);
 try {
  const redis=await getRedis();
  if(await redis.exists(key)) {
   const rows=await redis.zRangeWithScores(key,0,49,{REV:true});
   return {source:'Redis',data:rows.map((r,i)=>({...JSON.parse(r.value),kills:r.score,rank:i+1}))};
  }
 } catch {}
 const {rows}=await pool.query('SELECT player_id,username,kills FROM player_performance($1) ORDER BY kills DESC,player_id DESC LIMIT 50',[tournamentId]);
 const member=(r:Leader)=>JSON.stringify({player_id:r.player_id,username:r.username});
 const data:Leader[]=rows.map((r,i)=>({...r,rank:i+1}));
 data.sort((a,b)=>b.kills-a.kills || (member(a)<member(b)?1:-1));
 try {
  if(data.length) {
   const redis=await getRedis();
   const tx=redis.multi().del(key);
   tx.zAdd(key,data.map(r=>({score:r.kills,value:member(r)})));
   tx.expire(key,60);
   await tx.exec();
  }
 } catch {}
 return {data:data.map((r,i)=>({...r,rank:i+1})),source:'PostgreSQL'};
}
