import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Integration tests need a disposable Postgres database whose name contains
 * "test" (it is truncated between tests). Set TEST_DATABASE_URL, e.g.
 *   TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5433/arivo_test npm test
 */
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL is required to run tests");
if (!/test/i.test(new URL(url).pathname)) throw new Error("TEST_DATABASE_URL must point at a database named *test*");

execFileSync("node", [path.resolve(__dirname, "../scripts/migrate.mjs")], {
  env: { ...process.env, DATABASE_URL: url },
  stdio: "ignore",
});
