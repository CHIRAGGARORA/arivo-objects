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
    const res = await fetch(`/api/admin/orders/${orderId}/retry`, {
      method: "POST",
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(`Retry failed (${res.status})`);
    const failed = (data.report ?? []).filter(
      (r: { outcome: string }) => r.outcome === "failed",
    );
    setMsg(
      failed.length
        ? `Still failing: ${failed.map((f: { task: string }) => f.task).join(", ")}`
        : "Done",
    );
    router.refresh();
  }
  return (
    <span className="mt-2 inline-flex items-center gap-3">
      <button
        type="button"
        onClick={retry}
        disabled={busy}
        className="border border-charcoal px-3 py-1 text-xs disabled:opacity-50"
      >
        {busy ? "Retrying…" : "Retry failed steps"}
      </button>
      {msg && <span className="text-xs">{msg}</span>}
    </span>
  );
}

export function StockForm({
  slug,
  variantId,
  quantity,
}: {
  slug: string;
  variantId: string;
  quantity: number | null;
}) {
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
      <button
        type="submit"
        className="border border-charcoal px-2 py-1 text-xs"
      >
        Save
      </button>
      {msg && <span className="text-xs">{msg}</span>}
    </form>
  );
}

export function ReviewModeration({
  reviewId,
  approved = false,
}: {
  reviewId: number;
  approved?: boolean;
}) {
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
      {approved ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => act("reject")}
          className="border border-charcoal px-3 py-1 text-xs disabled:opacity-50"
        >
          Remove from website
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => act("approve")}
            className="border border-charcoal bg-charcoal px-3 py-1 text-xs text-ivory disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => act("reject")}
            className="border border-charcoal px-3 py-1 text-xs disabled:opacity-50"
          >
            Reject
          </button>
        </>
      )}
      {msg && <span className="text-xs">{msg}</span>}
    </span>
  );
}

const SOURCES = [
  ["instagram", "Instagram"],
  ["whatsapp", "WhatsApp"],
  ["in_person", "In person"],
  ["other", "Other"],
] as const;

/** Owner enters a review from a real customer who bought outside the website. */
export function OfflineReviewForm({
  productOptions,
}: {
  productOptions: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [today] = useState(() =>
    new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10),
  ); // IST
  const [form, setForm] = useState({
    productSlug: "",
    rating: 5,
    body: "",
    authorName: "",
    city: "",
    source: "instagram",
    reviewedOn: today,
    consent: false,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(data.message ?? `Error ${res.status}`);
    setMsg("Added and published.");
    setForm((f) => ({
      ...f,
      body: "",
      authorName: "",
      city: "",
      consent: false,
    }));
    router.refresh();
  }

  const field = "border border-sand bg-transparent px-2 py-1.5";
  return (
    <form
      onSubmit={submit}
      className="mt-4 grid max-w-2xl gap-3 border border-sand/70 p-4"
    >
      <p className="font-medium">Add a review from an offline customer</p>
      <p className="text-xs text-charcoal/60">
        Only for real people who bought this product from you outside the
        website (Instagram, WhatsApp, in person). Use their own words and the
        date they gave the review. It will show as &ldquo;Purchased via
        …&rdquo;, not &ldquo;Verified buyer&rdquo;.
      </p>
      <div className="flex flex-wrap gap-3">
        <select
          required
          value={form.productSlug}
          onChange={(e) => set("productSlug", e.target.value)}
          className={field}
          aria-label="Product"
        >
          <option value="">Product…</option>
          {productOptions.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={form.rating}
          onChange={(e) => set("rating", Number(e.target.value))}
          className={field}
          aria-label="Stars"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)}
            </option>
          ))}
        </select>
        <select
          value={form.source}
          onChange={(e) => set("source", e.target.value)}
          className={field}
          aria-label="Where they bought"
        >
          {SOURCES.map(([v, l]) => (
            <option key={v} value={v}>
              Bought via {l}
            </option>
          ))}
        </select>
        <input
          type="date"
          max={today}
          value={form.reviewedOn}
          onChange={(e) => set("reviewedOn", e.target.value)}
          className={field}
          aria-label="Date of review"
        />
      </div>
      <textarea
        required
        minLength={10}
        maxLength={1000}
        rows={3}
        value={form.body}
        onChange={(e) => set("body", e.target.value)}
        placeholder="The customer's review, in their words"
        className={field}
      />
      <div className="flex flex-wrap gap-3">
        <input
          required
          maxLength={40}
          value={form.authorName}
          onChange={(e) => set("authorName", e.target.value)}
          placeholder="Customer name (e.g. Priya S.)"
          className={field}
        />
        <input
          maxLength={60}
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          placeholder="City (optional)"
          className={field}
        />
      </div>
      <label className="flex items-start gap-2 text-xs">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => set("consent", e.target.checked)}
          className="mt-0.5"
          required
        />
        This is a real customer who bought this product, these are their words,
        and they agreed to it being published on the website.
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="border border-charcoal bg-charcoal px-4 py-1.5 text-xs text-ivory disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add review"}
        </button>
        {msg && <span className="text-xs">{msg}</span>}
      </div>
    </form>
  );
}

/** "Mark as shipped" / "Mark resolved" for one order. */
export function OrderAction({ orderId, action, label }: { orderId: string; action: "shipped" | "resolve"; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    setBusy(true);
    const res = await fetch(`/api/admin/orders/${orderId}/update`, {
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
    <span className="inline-flex items-center gap-2">
      <button type="button" disabled={busy} onClick={run} className="border border-charcoal px-3 py-1 text-xs disabled:opacity-50">
        {busy ? "Saving…" : label}
      </button>
      {msg && <span className="text-xs">{msg}</span>}
    </span>
  );
}
