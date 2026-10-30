import { NextResponse } from 'next/server';
import { authorize,failure,HttpError } from '@/lib/http';
import { getDashboardCounts,getPlayerStats } from '@/lib/queries';
import { leaderboard } from '@/lib/leaderboard';
export async function GET(req:Request){
 try {
  await authorize(req,false);const params=new URL(req.url).searchParams;const raw=params.get('tournament');
  if(raw && (!/^[1-9]\d*$/.test(raw)||Number(raw)>2147483647))throw new HttpError(400,'Invalid tournament ID');
  const id=raw?Number(raw):null;
  const view=params.get('view')??'dashboard';
  if(view==='dashboard')return NextResponse.json(await getDashboardCounts());
  if(view==='stats')return NextResponse.json(await getPlayerStats(id));
  if(view==='leaderboard')return NextResponse.json(await leaderboard(id));
  throw new HttpError(400,'Unknown analytics view');
 }catch(e){return failure(e);}
}
