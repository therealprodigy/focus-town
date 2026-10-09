import type { Plugin } from "vite";
import { mkdirSync } from "node:fs";
import { openDatabase } from "./sqlite.ts";
import { handleApi } from "./room-service.ts";
export function roomsPlugin(): Plugin {
  return {
    name: "focus-town-local-rooms",
    configureServer(server) {
      mkdirSync(".sites-runtime", { recursive: true });
      const db = openDatabase(".sites-runtime/focus-town.sqlite");
      server.httpServer?.once("close", () => db.close());
      server.middlewares.use("/api/", async (req, res) => {
        try {
          let size = 0;
          const chunks: Uint8Array[] = [];
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 4096) {
              res.statusCode = 413;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Request too large." }));
              return;
            }
            chunks.push(chunk);
          }
          const headers = new Headers();
          for (const [name, value] of Object.entries(req.headers)) {
            if (value)
              headers.set(name, Array.isArray(value) ? value.join(",") : value);
          }
          const method = req.method ?? "GET";
          const request = new Request(
            "http://" +
              (req.headers.host ?? "127.0.0.1:5173") +
              (req.originalUrl ?? "/api/"),
            {
              method,
              headers,
              body:
                method === "GET" || method === "HEAD"
                  ? undefined
                  : Buffer.concat(chunks).toString(),
            },
          );
          const result = await handleApi(request, { DB: db });
          res.statusCode = result.status;
          result.headers.forEach((value, name) => res.setHeader(name, value));
          res.end(await result.text());
        } catch {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({ error: "The local room service is unavailable." }),
          );
        }
      });
    },
  };
}
