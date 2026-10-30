"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useUser } from './SessionProvider';

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "hidden";
  options?: { value: string | number; label: string }[];
  required?: boolean;
  numeric?: boolean; // send as a number (for ids and numbers)
  step?: string;
  value?: string | number; // used by hidden fields
  defaultValue?: string | number;
};

/** A reusable form: posts its fields as JSON to `endpoint`, then refreshes the page. */
export default function EntityForm({
  title,
  endpoint,
  fields,
  method = 'POST',
  reset = true,
}: {
  title: string;
  endpoint: string;
  fields: Field[];
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  reset?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing,startTransition]=useTransition();
  const user=useUser();
  if(user?.role!=='admin') return null;

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget; // keep a reference before any await
    setError("");
    setSuccess("");
    setBusy(true);

    const form = new FormData(formEl);
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = form.get(f.name);
      const text = raw === null ? "" : String(raw);
      if (f.type === "hidden") body[f.name] = f.value;
      else if (text === "") body[f.name] = null;
      else body[f.name] = f.type === "number" || f.numeric ? Number(text) : text;
    }

    try {
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      return;
    }
    setSuccess("Saved!");
    if(reset) formEl.reset();
    startTransition(()=>router.refresh());
    } catch { setError('Unable to connect. Please retry.'); }
    finally {setBusy(false);}
  }

  return (
    <form onSubmit={onSubmit} className="card form">
      <h3>{title}</h3>
      {fields.map((f) =>
        f.type === "hidden" ? (
          <input key={f.name} type="hidden" name={f.name} value={f.value} />
        ) : (
          <label key={f.name}>
            {f.label}
            {f.type === "select" ? (
              <select aria-label={f.label} name={f.name} required={f.required ?? true} defaultValue={f.defaultValue ?? ''}>
                <option value="">-- choose --</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                aria-label={f.label}
                name={f.name}
                type={f.type ?? "text"}
                step={f.step}
                defaultValue={f.defaultValue}
                min={f.type==='number'?0:undefined}
                required={f.required ?? true}
              />
            )}
          </label>
        )
      )}
      <button type="submit" disabled={busy||refreshing}>
        {busy||refreshing ? "Saving..." : "Save"}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
      {success && <p className="success" role="status">{success}</p>}
    </form>
  );
}
