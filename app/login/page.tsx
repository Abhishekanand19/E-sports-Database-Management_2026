'use client';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
export default function Login(){
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);const router=useRouter();
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError('');const data=new FormData(e.currentTarget);
  try {const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(data))});const json=await res.json();if(!res.ok)throw new Error(json.error);router.push('/');router.refresh();}catch(err){setError(err instanceof Error?err.message:'Unable to sign in');}finally{setBusy(false);}
 }
 return <section className="login"><p className="eyebrow">ESPORTSHUB / TOURNAMENT OPERATIONS</p><h1>Welcome back</h1><p className="muted">Sign in to follow tournaments and player performance. Administrators can manage competition records.</p><form className="card form" onSubmit={submit}><label>Username<input name="username" autoComplete="username" required maxLength={50}/></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256}/></label><button disabled={busy}>{busy?'Signing in...':'Sign in'}</button>{error&&<p role="alert" className="error">{error}</p>}</form></section>;
}
