import { z } from 'zod';
const text = (max: number) => z.string().trim().min(1).max(max);
const id = z.number().int().positive();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => { const d=new Date(s+'T00:00:00Z'); return !isNaN(d.valueOf()) && d.toISOString().slice(0,10)===s; },'Invalid calendar date');
export const schemas = {
 players: z.object({username:text(50),country:text(60),role:text(30),date_of_birth:date}),
 teams: z.object({team_name:text(80),country:text(60),founded_date:date.nullable().optional()}),
 tournaments: z.object({name:text(120),game_id:id,start_date:date,end_date:date,prize_pool:z.number().min(0).max(9999999999.99)}),
 matches: z.object({tournament_id:id,match_date:date,round:text(30),team_a:id,team_b:id}),
 results: z.object({match_id:id,winning_team_id:id,losing_team_id:id,score:z.string().regex(/^\d{1,3}-\d{1,3}$/)}),
 stats: z.object({match_id:id,team_id:id,player_id:id,kills:z.number().int().nonnegative().max(2147483647),deaths:z.number().int().nonnegative().max(2147483647),assists:z.number().int().nonnegative().max(2147483647),damage:z.number().int().nonnegative().max(2147483647),rating:z.number().min(0).max(9.99).nullable().optional()}),
 'team-members':z.object({team_id:id,player_id:id,join_date:date,status:z.enum(['active','inactive']).default('active'),leave_date:date.nullable().optional()}),
 participations:z.object({tournament_id:id,team_id:id,final_position:id.nullable().optional()}),
 login:z.object({username:text(50).transform(s=>s.toLowerCase()),password:z.string().min(1).max(256)})
};
export function parseId(value: string) { if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value)>2147483647) throw new Error('Invalid id'); return Number(value); }
