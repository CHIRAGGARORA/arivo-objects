import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Fakes, resetDb, setEnv, sql } from "./helpers";
import { GET as health } from "@/app/api/health/route";

beforeEach(async () => {
  setEnv();
  await resetDb();
  new Fakes().install();
});
afterEach(() => vi.unstubAllGlobals());

describe("health report", () => {
  it("checks database, write path, Razorpay auth and Shiprocket pickup without leaving data or exposing values", async () => {
    const res = await health(new Request("https://example.test/api/health"));
    const body = await res.json();
    expect(body.checks.database.ok).toBe(true);
    expect(body.checks.writeRollback.ok).toBe(true);
    expect(body.checks.razorpayAuth.ok).toBe(true);
    expect(body.checks.shiprocketPickup.ok).toBe(true);
    expect(await sql("SELECT 1 FROM contact_messages")).toHaveLength(0);
    const text = JSON.stringify(body);
    for (const secret of ["test_key_secret_not_real", "test_webhook_secret_not_real", "fake-password", "re_test_fake", "admin-password-for-tests"]) {
      expect(text).not.toContain(secret);
    }
  });

  it("reports a pickup-location mismatch", async () => {
    setEnv({ SHIPROCKET_PICKUP_LOCATION: "studio" }); // wrong case
    const body = await (await health(new Request("https://example.test/api/health"))).json();
    expect(body.checks.shiprocketPickup.ok).toBe(false);
  });

  it("requires admin auth in production", async () => {
    setEnv({ VERCEL_ENV: "production" });
    expect((await health(new Request("https://example.test/api/health"))).status).toBe(401);
  });
});
