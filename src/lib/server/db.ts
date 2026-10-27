import "server-only";
import { Pool, PoolClient } from "pg";
import { config } from "./config";

/**
 * One pool per server instance. On Vercel, use Neon's *pooled* connection
 * string (host contains "-pooler") as DATABASE_URL.
 */
let pool: Pool | null = null;
let poolUrl: string | undefined;

export class DatabaseUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Database unavailable");
    this.name = "DatabaseUnavailableError";
    this.cause = cause;
  }
}

export function getPool(): Pool {
  const url = config.databaseUrl();
  if (!url) throw new DatabaseUnavailableError("DATABASE_URL not set");
  if (!pool || poolUrl !== url) {
    void pool?.end().catch(() => {});
    pool = new Pool({
      connectionString: url,
      max: 5,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
    });
    // An idle client erroring (e.g. Neon scaling to zero) must not crash the process.
    pool.on("error", () => {});
    poolUrl = url;
  }
  return pool;
}

let guardChecked: string | null = null;

/**
 * Runtime half of the environment guard in scripts/migrate.mjs: on Vercel
 * preview/production deployments, refuse to process orders or payments if the
 * database was claimed by the other environment. Cached per server instance.
 */
export async function ensureDatabaseEnvironment(): Promise<void> {
  const env = process.env.VERCEL_ENV;
  if (env !== "production" && env !== "preview") return;
  if (guardChecked === env) return;
  const rows = (await getPool().query<{ environment: string }>(
    "SELECT environment FROM deployment_guard WHERE id = 1"
  ).catch(() => ({ rows: [] as { environment: string }[] }))).rows;
  if (rows[0]?.environment !== env) {
    throw new DatabaseEnvironmentError(rows[0]?.environment ?? "unclaimed", env);
  }
  guardChecked = env;
}

export class DatabaseEnvironmentError extends Error {
  constructor(owner: string, env: string) {
    super(`Database belongs to "${owner}", not "${env}"; refusing to process orders.`);
    this.name = "DatabaseEnvironmentError";
  }
}

/** Test helper: close the pool so a new DATABASE_URL takes effect cleanly. */
export async function resetPool(): Promise<void> {
  const p = pool;
  pool = null;
  guardChecked = null;
  poolUrl = undefined;
  await p?.end().catch(() => {});
}

function isConnectionError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "57P01" || // admin_shutdown
    code === "57P03" || // cannot_connect_now
    (err instanceof Error && /timeout|terminated|connect/i.test(err.message))
  );
}

async function connect(): Promise<PoolClient> {
  try {
    return await getPool().connect();
  } catch (err) {
    throw new DatabaseUnavailableError(err);
  }
}

export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const client = await connect();
  try {
    return (await client.query(text, params)).rows as T[];
  } catch (err) {
    if (isConnectionError(err)) throw new DatabaseUnavailableError(err);
    throw err;
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    if (isConnectionError(err)) throw new DatabaseUnavailableError(err);
    throw err;
  } finally {
    client.release();
  }
}
