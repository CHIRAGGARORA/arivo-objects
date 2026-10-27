#!/usr/bin/env node
/**
 * Applies db/migrations/*.sql in filename order, once each, recording them in
 * schema_migrations. Each file runs in its own transaction under an advisory
 * lock, so concurrent deploys can't apply the same migration twice.
 *
 * Usage: DATABASE_URL=... node scripts/migrate.mjs
 *        node scripts/migrate.mjs --if-configured   (no-op when DATABASE_URL is unset)
 *
 * Migrations are additive. Never edit an applied migration — add a new file.
 */
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const LOCK_ID = 727_001; // arbitrary constant shared by all deploys
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");

const url = process.env.DATABASE_URL;
if (!url) {
  if (process.argv.includes("--if-configured")) {
    console.log("[migrate] DATABASE_URL not set — skipping migrations.");
    process.exit(0);
  }
  console.error("[migrate] DATABASE_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);

  const applied = new Map(
    (await client.query("SELECT name, checksum FROM schema_migrations")).rows.map((r) => [r.name, r.checksum])
  );
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = await readFile(path.join(dir, file), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    if (applied.has(file)) {
      if (applied.get(file) !== checksum) {
        throw new Error(`Applied migration ${file} has been modified. Add a new migration instead.`);
      }
      continue;
    }
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [file, checksum]);
      await client.query("COMMIT");
      console.log(`[migrate] applied ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${err.message}`);
    }
  }
  console.log("[migrate] up to date.");
} finally {
  await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => {});
  await client.end();
}
