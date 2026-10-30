"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "hidden";
  options?: { value: string | number; label: string }[];
  required?: boolean;
  numeric?: boolean; // send as a number (for ids and numbers)
  step?: string;
  value?: string | number; // used by hidden fields
};

/** A reusable form: posts its fields as JSON to `endpoint`, then refreshes the page. */
export default function EntityForm({
  title,
  endpoint,
  fields,
}: {
  title: string;
  endpoint: string;
  fields: Field[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

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

    const res = await fetch(endpoint, {
      method: "POST",
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
    formEl.reset(); // use the saved reference
    router.refresh();
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
              <select name={f.name} required={f.required ?? true}>
                <option value="">-- choose --</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={f.name}
                type={f.type ?? "text"}
                step={f.step}
                required={f.required ?? true}
              />
            )}
          </label>
        )
      )}
      <button type="submit" disabled={busy}>
        {busy ? "Saving..." : "Save"}
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </form>
  );
}
