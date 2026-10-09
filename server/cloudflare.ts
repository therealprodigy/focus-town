import { handleApi, type Env } from "./room-service";

export type CloudflareEnv = Env & {
  ASSETS: { fetch(request: Request): Promise<Response> };
};
const pages = new Set(["/", "/privacy", "/terms", "/cookies"]);
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; base-uri 'self'; object-src 'none'";

function assetResponse(
  response: Response,
  request: Request,
  status = response.status,
  cacheControl?: string,
): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Content-Security-Policy", CSP);
  if (cacheControl) headers.set("Cache-Control", cacheControl);
  return new Response(request.method === "HEAD" ? null : response.body, {
    status,
    headers,
  });
}
async function shell(
  request: Request,
  env: CloudflareEnv,
  status: 200 | 404,
): Promise<Response> {
  const url = new URL(request.url);
  url.pathname = "/index.html";
  url.search = "";
  // A fallback must not inherit range or cache validators from another path.
  const response = await env.ASSETS.fetch(
    new Request(url, { method: request.method }),
  );
  if (response.status !== 200)
    return assetResponse(response, request, response.status, "no-store");
  return assetResponse(
    response,
    request,
    status,
    status === 404 ? "no-store" : "no-cache",
  );
}
export default {
  async fetch(request: Request, env: CloudflareEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const response = await handleApi(request, env);
      return request.method === "HEAD"
        ? new Response(null, {
            status: response.status,
            headers: response.headers,
          })
        : response;
    }
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    if (pages.has(url.pathname)) return shell(request, env, 200);
    let assetRequest = request;
    if (request.method === "HEAD" && request.headers.has("Range")) {
      const headers = new Headers(request.headers);
      headers.delete("Range");
      assetRequest = new Request(request, { headers });
    }
    const response = await env.ASSETS.fetch(assetRequest);
    if (response.status === 404) return shell(request, env, 404);
    return assetResponse(response, request);
  },
};
