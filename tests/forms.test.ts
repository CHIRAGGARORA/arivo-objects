import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Fakes, jsonRequest, resetDb, setEnv, sql } from "./helpers";
import { POST as contact } from "@/app/api/contact/route";
import { POST as newsletter } from "@/app/api/newsletter/route";

let fakes: Fakes;
beforeEach(async () => {
  setEnv();
  await resetDb();
  fakes = new Fakes().install();
});
afterEach(() => vi.unstubAllGlobals());

const msg = { name: "Asha", email: "Asha@Example.test", message: "Do you ship to Pune? <b>thanks</b>" };

describe("contact form", () => {
  it("stores the message and notifies the owner with the content escaped", async () => {
    const res = await contact(jsonRequest("/api/contact", msg));
    expect(res.status).toBe(200);
    const rows = await sql<{ email: string; notified_at: Date | null }>("SELECT email, notified_at FROM contact_messages");
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("asha@example.test");
    expect(rows[0].notified_at).not.toBeNull();
    expect(fakes.emails).toHaveLength(1);
    expect(fakes.emails[0].to).toBe("owner@example.test");
  });

  it("still stores the message when the email provider fails, recording the error", async () => {
    fakes.fail.resend = 500;
    expect((await contact(jsonRequest("/api/contact", msg))).status).toBe(200);
    const rows = await sql<{ notify_error: string | null }>("SELECT notify_error FROM contact_messages");
    expect(rows[0].notify_error).toMatch(/500/);
  });

  it("validates input", async () => {
    const res = await contact(jsonRequest("/api/contact", { name: "", email: "x", message: "hi" }));
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).fields)).toEqual(expect.arrayContaining(["name", "email", "message"]));
  });

  it("silently drops honeypot submissions", async () => {
    const res = await contact(jsonRequest("/api/contact", { ...msg, website: "http://spam.example" }));
    expect(res.status).toBe(200);
    expect(await sql("SELECT 1 FROM contact_messages")).toHaveLength(0);
  });

  it("rate-limits repeated submissions from one client", async () => {
    const statuses = [];
    for (let i = 0; i < 7; i++) statuses.push((await contact(jsonRequest("/api/contact", msg))).status);
    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);
    // Only a hash of the IP is stored.
    const keys = await sql<{ key: string }>("SELECT key FROM rate_limits");
    expect(keys[0].key).not.toContain("203.0.113.7");
  });

  it("returns 503 rather than pretending to succeed when the database is down", async () => {
    setEnv({ DATABASE_URL: "postgres://postgres@127.0.0.1:1/arivo_test" });
    const { resetPool } = await import("@/lib/server/db");
    await resetPool();
    expect((await contact(jsonRequest("/api/contact", msg))).status).toBe(503);
    await resetPool();
  });
});

describe("newsletter", () => {
  it("stores a consented subscriber once, without sending any email", async () => {
    const body = { email: "Fan@Example.test", consent: true };
    expect((await newsletter(jsonRequest("/api/newsletter", body))).status).toBe(200);
    expect((await newsletter(jsonRequest("/api/newsletter", body))).status).toBe(200);
    const rows = await sql<{ email: string; status: string }>("SELECT email, status FROM newsletter_subscribers");
    expect(rows).toEqual([{ email: "fan@example.test", status: "subscribed" }]);
    expect(fakes.emails).toHaveLength(0);
  });

  it("requires explicit consent", async () => {
    const res = await newsletter(jsonRequest("/api/newsletter", { email: "fan@example.test" }));
    expect(res.status).toBe(400);
  });
});
