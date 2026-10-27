import { execFileSync } from "node:child_process";
import path from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ensureDatabaseEnvironment, resetPool } from "@/lib/server/db";

/** Uses its own scratch database so the shared test DB stays unclaimed. */
const base = new URL(process.env.TEST_DATABASE_URL!);
const GUARD_DB = "arivo_guard_test";
const guardUrl = (() => {
  const u = new URL(base.href);
  u.pathname = `/${GUARD_DB}`;
  return u.href;
})();

async function admin(sql: string) {
  const u = new URL(base.href);
  u.pathname = "/postgres";
  const c = new pg.Client({ connectionString: u.href });
  await c.connect();
  try {
    await c.query(sql);
  } finally {
    await c.end();
  }
}

function migrate(vercelEnv: string) {
  return execFileSync("node", [path.resolve(import.meta.dirname, "../scripts/migrate.mjs")], {
    env: { ...process.env, DATABASE_URL: guardUrl, VERCEL_ENV: vercelEnv },
    encoding: "utf8",
    stdio: "pipe",
  });
}

beforeAll(async () => {
  await admin(`DROP DATABASE IF EXISTS ${GUARD_DB}`);
  await admin(`CREATE DATABASE ${GUARD_DB}`);
});
afterAll(async () => {
  await resetPool();
  delete process.env.VERCEL_ENV;
  await admin(`DROP DATABASE IF EXISTS ${GUARD_DB} WITH (FORCE)`);
});

describe("database environment guard", () => {
  it("lets the first environment claim the database and blocks the other at build time", () => {
    expect(migrate("preview")).toMatch(/database environment: preview/);
    expect(migrate("preview")).toMatch(/database environment: preview/); // repeatable
    expect(() => migrate("production")).toThrow(/belongs to the "preview" environment/);
  });

  it("refuses order/payment processing at runtime when the database belongs to the other environment", async () => {
    process.env.DATABASE_URL = guardUrl;
    await resetPool();
    process.env.VERCEL_ENV = "production";
    await expect(ensureDatabaseEnvironment()).rejects.toThrow(/belongs to "preview"/);
    await resetPool();
    process.env.VERCEL_ENV = "preview";
    await expect(ensureDatabaseEnvironment()).resolves.toBeUndefined();
  });
});
