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

/** Test helper: close the pool so a new DATABASE_URL takes effect cleanly. */
export async function resetPool(): Promise<void> {
  const p = pool;
  pool = null;
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
