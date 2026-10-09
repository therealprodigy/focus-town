import { createClient } from "@libsql/client/web";
import { libsqlDatabase } from "../server/libsql.js";
import { createVercelHandler } from "../server/vercel-handler.js";
import type { Database } from "../server/room-service.js";
let pending: Promise<Database> | undefined;
function database(): Promise<Database> {
  if (!pending) {
    pending = (async () => {
      const url = process.env.TURSO_DATABASE_URL;
      const authToken = process.env.TURSO_AUTH_TOKEN;
      if (!url || !authToken) throw new Error("Database is not configured");
      if (!["libsql:", "https:"].includes(new URL(url).protocol))
        throw new Error("A remote database is required");
      const client = createClient({ url, authToken, intMode: "number" });
      try {
        const foreignKeys = await client.execute("PRAGMA foreign_keys");
        if (Number(foreignKeys.rows[0]?.[0]) !== 1)
          throw new Error("Foreign key enforcement is required");
        return libsqlDatabase(client);
      } catch (error) {
        client.close();
        throw error;
      }
    })().catch((error) => {
      pending = undefined;
      throw error;
    });
  }
  return pending;
}
export default { fetch: createVercelHandler(database) };
