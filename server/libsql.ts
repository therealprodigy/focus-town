import type { Client, ResultSet } from "@libsql/client";
import type { Database, Statement, SqlResult } from "./room-service.js";
type Bound = string | number | bigint | null;
function bindValues(input: unknown[]): Bound[] {
  return input.map((v) => {
    if (
      v === null ||
      typeof v === "string" ||
      typeof v === "bigint" ||
      (typeof v === "number" && Number.isFinite(v))
    )
      return v;
    throw new TypeError("Unsupported SQL parameter");
  });
}
function rows(r: ResultSet): Record<string, unknown>[] {
  return r.rows.map((row) =>
    Object.fromEntries(r.columns.map((name) => [name, row[name]])),
  );
}
function result(r: ResultSet): SqlResult {
  return { meta: { changes: r.rowsAffected }, results: rows(r) };
}
export function libsqlDatabase(client: Client): Database {
  class Query implements Statement {
    readonly owner = client;
    constructor(
      readonly sql: string,
      readonly args: Bound[] = [],
    ) {}
    bind(...args: unknown[]) {
      return new Query(this.sql, bindValues(args));
    }
    async first<T = Record<string, unknown>>(): Promise<T | null> {
      return (rows(
        await client.execute({ sql: this.sql, args: this.args }),
      )[0] ?? null) as T | null;
    }
    async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
      return {
        results: rows(
          await client.execute({ sql: this.sql, args: this.args }),
        ) as T[],
      };
    }
    async run() {
      return result(await client.execute({ sql: this.sql, args: this.args }));
    }
  }
  return {
    prepare: (sql) => new Query(sql),
    async batch(statements) {
      const prepared = statements.map((s) => {
        if (!(s instanceof Query) || s.owner !== client)
          throw new TypeError("Statement belongs to another database");
        return { sql: s.sql, args: s.args };
      });
      if (!prepared.length) return [];
      return (await client.batch(prepared, "write")).map(result);
    },
  };
}
