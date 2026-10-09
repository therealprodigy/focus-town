import { isIP } from "node:net";
import { handleApi, type Database } from "./room-service.js";
export function vercelRequest(request: Request): Request {
  const headers = new Headers(request.headers);
  headers.delete("CF-Connecting-IP");
  const candidate = headers.get("x-vercel-forwarded-for")?.trim() ?? "";
  headers.set(
    "CF-Connecting-IP",
    isIP(candidate) ? candidate : "vercel-unknown",
  );
  return new Request(request, { headers });
}
export function createVercelHandler(database: () => Promise<Database>) {
  return async (request: Request): Promise<Response> => {
    try {
      const response = await handleApi(vercelRequest(request), {
        DB: await database(),
      });
      return request.method === "HEAD"
        ? new Response(null, {
            status: response.status,
            headers: response.headers,
          })
        : response;
    } catch {
      return new Response(
        request.method === "HEAD"
          ? null
          : JSON.stringify({
              error: "The room database is unavailable. Try again shortly.",
            }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
          },
        },
      );
    }
  };
}
