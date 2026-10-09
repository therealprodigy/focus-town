import { createClient } from "@libsql/client";
import { openDatabase } from "../server/sqlite";
import { libsqlDatabase } from "../server/libsql";
import { applyMigrations, readMigrations } from "../scripts/migrate-libsql";
export async function openTestDatabase() {
  if (process.env.FOCUS_TEST_DATABASE !== "libsql") return openDatabase();
  const client = createClient({ url: ":memory:", intMode: "number" });
  try {
    await client.execute("PRAGMA foreign_keys=ON");
    await applyMigrations(client, await readMigrations());
    return { ...libsqlDatabase(client), close: () => client.close() };
  } catch (error) {
    client.close();
    throw error;
  }
}
