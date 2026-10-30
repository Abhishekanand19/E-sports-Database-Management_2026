'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './SessionProvider';
export default function ActionButton({endpoint,payload,label}:{endpoint:string;payload:Record<string,unknown>;label:string}) {
 const user=useUser();const router=useRouter();const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 if(user?.role!=='admin')return null;
 return <><button disabled={busy} className="danger" onClick={async()=>{if(!confirm(`${label}?`))return;setBusy(true);setError('');try{const res=await fetch(endpoint,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!res.ok)throw new Error((await res.json()).error);router.refresh();}catch(err){setError(err instanceof Error?err.message:'Unable to connect');}finally{setBusy(false);}}}>{label}</button>{error&&<span className="error" role="alert">{error}</span>}</>;
}
