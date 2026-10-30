"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ url, label = "Delete" }: { url: string; label?: string }) {
  const router = useRouter();

  async function remove() {
    if (!confirm("Are you sure you want to delete this?")) return;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) {
      alert((await res.json()).error ?? "Delete failed");
      return;
    }
    router.refresh();
  }

  return (
    <button type="button" className="danger" onClick={remove}>
      {label}
    </button>
  );
}
