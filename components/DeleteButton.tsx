"use client";

import { useRouter } from "next/navigation";
import { useState } from 'react';
import { useUser } from './SessionProvider';

export default function DeleteButton({ url, label = "Delete" }: { url: string; label?: string }) {
  const router = useRouter();
  const user=useUser();
  const [busy,setBusy]=useState(false);
  if(user?.role!=='admin')return null;

  async function remove() {
    if (!confirm("Are you sure you want to delete this?")) return;
    setBusy(true);
    try {
    const res = await fetch(url, { method: "DELETE",headers:{'Content-Type':'application/json'},body:'{}' });
    if (!res.ok) {
      alert((await res.json()).error ?? "Delete failed");
      return;
    }
    router.refresh();
    } catch {alert('Unable to connect. Please retry.');} finally{setBusy(false);}
  }

  return (
    <button type="button" className="danger" disabled={busy} onClick={remove}>
      {label}
    </button>
  );
}
