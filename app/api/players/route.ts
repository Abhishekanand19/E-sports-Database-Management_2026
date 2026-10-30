import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { authorize,body,failure,HttpError } from '@/lib/http';
import { schemas,parseId } from '@/lib/validation';

export async function GET(req:Request) {
 try {await authorize(req,false); const r=await pool.query('SELECT * FROM PLAYER ORDER BY player_id');return NextResponse.json(r.rows);} catch(e) {return failure(e);}
}
export async function POST(req:Request) {
 try {
  await authorize(req); const input=await body(req,schemas.players);
  const r=await pool.query('INSERT INTO PLAYER(username,country,role,date_of_birth) VALUES($1,$2,$3,$4) RETURNING *',[input.username ?? null,input.country ?? null,input.role ?? null,input.date_of_birth ?? null]);
  return NextResponse.json(r.rows[0],{status:201});
 } catch(e) {return failure(e);}
}
