import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { authorize,body,failure,HttpError } from '@/lib/http';
import { schemas,parseId } from '@/lib/validation';

export async function GET(req:Request) {
 try {await authorize(req,false); const r=await pool.query('SELECT * FROM TOURNAMENT ORDER BY tournament_id');return NextResponse.json(r.rows);} catch(e) {return failure(e);}
}
export async function POST(req:Request) {
 try {
  await authorize(req); const input=await body(req,schemas.tournaments);
  const r=await pool.query('INSERT INTO TOURNAMENT(name,game_id,start_date,end_date,prize_pool) VALUES($1,$2,$3,$4,$5) RETURNING *',[input.name ?? null,input.game_id ?? null,input.start_date ?? null,input.end_date ?? null,input.prize_pool ?? null]);
  return NextResponse.json(r.rows[0],{status:201});
 } catch(e) {return failure(e);}
}
