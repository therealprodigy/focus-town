import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Database, Statement, SqlResult } from "./room-service.ts";
class Query implements Statement {
  constructor(
    private db: DatabaseSync,
    private sql: string,
    private values: SQLInputValue[] = [],
  ) {}
  bind(...values: unknown[]): Query {
    return new Query(this.db, this.sql, values as SQLInputValue[]);
  }
  async first<T>(): Promise<T | null> {
    return (this.db.prepare(this.sql).get(...this.values) ?? null) as T | null;
  }
  async all<T>(): Promise<{ results: T[] }> {
    return { results: this.db.prepare(this.sql).all(...this.values) as T[] };
  }
  runNow(): SqlResult {
    const r = this.db.prepare(this.sql).run(...this.values);
    return { meta: { changes: Number(r.changes) } };
  }
  async run() {
    return this.runNow();
  }
}
export function openDatabase(
  filename = ":memory:",
  migrations = "drizzle",
): Database & { close: () => void } {
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)",
  );
  for (const file of readdirSync(migrations)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (db.prepare("SELECT name FROM local_migrations WHERE name=?").get(file))
      continue;
    db.exec("BEGIN");
    try {
      db.exec(readFileSync(join(migrations, file), "utf8"));
      db.prepare("INSERT INTO local_migrations(name) VALUES (?)").run(file);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  return {
    prepare: (sql: string) => new Query(db, sql),
    batch: async (statements: Statement[]) => {
      db.exec("BEGIN");
      try {
        const results = statements.map((s) => (s as Query).runNow());
        db.exec("COMMIT");
        return results;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
    close: () => db.close(),
  };
}
