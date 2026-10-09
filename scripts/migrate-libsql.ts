import { createClient, type Client } from "@libsql/client";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
export type Migration = { name: string; sql: string };
export async function readMigrations(directory = "drizzle") {
  const names = (await readdir(directory))
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort();
  return Promise.all(
    names.map(async (name) => ({
      name,
      sql: await readFile(join(directory, name), "utf8"),
    })),
  );
}
export async function applyMigrations(
  client: Client,
  migrations: Migration[],
): Promise<void> {
  const fk = await client.execute("PRAGMA foreign_keys");
  if (Number(fk.rows[0]?.[0]) !== 1)
    throw new Error("Foreign key enforcement is required");
  await client.execute(
    "CREATE TABLE IF NOT EXISTS focus_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at INTEGER NOT NULL)",
  );
  const names = new Set<string>();
  for (const migration of [...migrations].sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (names.has(migration.name)) throw new Error("Duplicate migration name");
    names.add(migration.name);
    const checksum = createHash("sha256").update(migration.sql).digest("hex");
    const previous = await client.execute({
      sql: "SELECT checksum FROM focus_migrations WHERE name=?",
      args: [migration.name],
    });
    if (previous.rows.length) {
      if (previous.rows[0].checksum !== checksum)
        throw new Error("An applied migration has changed");
      continue;
    }
    const statements = migration.sql
      .split("--> statement-breakpoint")
      .map((sql) => sql.trim())
      .filter(Boolean);
    if (!statements.length) throw new Error("Empty migration");
    await client.batch(
      [
        ...statements.map((sql) => ({ sql, args: [] })),
        {
          sql: "INSERT INTO focus_migrations(name,checksum,applied_at) VALUES (?,?,?)",
          args: [migration.name, checksum, Date.now()],
        },
      ],
      "write",
    );
  }
}
async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error("Database credentials are missing");
  if (!["libsql:", "https:"].includes(new URL(url).protocol))
    throw new Error("A remote database is required");
  const client = createClient({ url, authToken, intMode: "number" });
  try {
    await applyMigrations(client, await readMigrations());
    console.log("Database migrations applied.");
  } finally {
    client.close();
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(() => {
    console.error("Database migration failed. Deployment must not proceed.");
    process.exitCode = 1;
  });
}
