"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function RetryButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function retry() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${orderId}/retry`, { method: "POST", credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(`Retry failed (${res.status})`);
    const failed = (data.report ?? []).filter((r: { outcome: string }) => r.outcome === "failed");
    setMsg(failed.length ? `Still failing: ${failed.map((f: { task: string }) => f.task).join(", ")}` : "Done");
    router.refresh();
  }
  return (
    <span className="mt-2 inline-flex items-center gap-3">
      <button type="button" onClick={retry} disabled={busy} className="border border-charcoal px-3 py-1 text-xs disabled:opacity-50">
        {busy ? "Retrying…" : "Retry failed steps"}
      </button>
      {msg && <span className="text-xs">{msg}</span>}
    </span>
  );
}

export function StockForm({ slug, variantId, quantity }: { slug: string; variantId: string; quantity: number | null }) {
  const router = useRouter();
  const [value, setValue] = useState(quantity === null ? "" : String(quantity));
  const [msg, setMsg] = useState<string | null>(null);
  async function save(e: FormEvent) {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) return setMsg("Whole number ≥ 0");
    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, variantId, quantity: n }),
    });
    setMsg(res.ok ? "Saved" : `Error ${res.status}`);
    router.refresh();
  }
  return (
    <form onSubmit={save} className="flex items-center gap-2">
      <input
        aria-label={`Stock for ${slug} ${variantId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="numeric"
        placeholder="none"
        className="w-20 border border-sand bg-transparent px-2 py-1"
      />
      <button type="submit" className="border border-charcoal px-2 py-1 text-xs">Save</button>
      {msg && <span className="text-xs">{msg}</span>}
    </form>
  );
}

export function ReviewModeration({ reviewId }: { reviewId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function act(action: "approve" | "reject") {
    setBusy(true);
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (!res.ok) return setMsg(`Error ${res.status}`);
    router.refresh();
  }
  return (
    <span className="mt-2 inline-flex items-center gap-2">
      <button type="button" disabled={busy} onClick={() => act("approve")} className="border border-charcoal bg-charcoal px-3 py-1 text-xs text-ivory disabled:opacity-50">
        Approve
      </button>
      <button type="button" disabled={busy} onClick={() => act("reject")} className="border border-charcoal px-3 py-1 text-xs disabled:opacity-50">
        Reject
      </button>
      {msg && <span className="text-xs">{msg}</span>}
    </span>
  );
}
